import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  SecuritySchemas,
  XSSProtection,
  CSRFProtection,
  RateLimiter,
  InputSanitizer,
  SecurityError,
  ValidationError,
  RateLimitError,
} from "../lib/security";

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  zipCode?: string;
  acceptTerms: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  zipCode?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// AUTHENTICATION CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ============================================================================
// AUTHENTICATION PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user && !!session;

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    console.error("Auth error:", error);

    if (error instanceof SecurityError) {
      setError(error.message);
    } else if (error instanceof ValidationError) {
      setError(error.message);
    } else if (error instanceof RateLimitError) {
      setError(error.message);
    } else if (error instanceof AuthError) {
      // Map Supabase auth errors to user-friendly messages
      switch (error.message) {
        case "Invalid login credentials":
          setError("Invalid email or password. Please try again.");
          break;
        case "Email not confirmed":
          setError("Please check your email and click the confirmation link.");
          break;
        case "User already registered":
          setError("An account with this email already exists.");
          break;
        case "Password should be at least 6 characters":
          setError(
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
          );
          break;
        default:
          setError(error.message);
      }
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError(defaultMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        // Get user data from auth.users (built-in Supabase table)
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          console.error("Error fetching user:", userError);
          return null;
        }

        const user = userData.user;
        const metadata = user.user_metadata || {};

        return {
          id: user.id,
          email: user.email || "",
          firstName: metadata.first_name || "",
          lastName: metadata.last_name || "",
          zipCode: metadata.zip_code,
          bio: metadata.bio,
          avatar: user.user_metadata?.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at || user.created_at,
        };
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    },
    []
  );

  const createUserProfile = useCallback(
    async (user: User, profileData: Partial<RegisterData>): Promise<void> => {
      try {
        // Check if we have an active session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Auth session missing!");
        }

        // Update user metadata with profile information
        const { error } = await supabase.auth.updateUser({
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            zip_code: profileData.zipCode,
            full_name:
              `${profileData.firstName} ${profileData.lastName}`.trim(),
          },
        });

        if (error) {
          throw new Error(`Failed to create profile: ${error.message}`);
        }
      } catch (error) {
        console.error("Error creating profile:", error);
        throw error;
      }
    },
    []
  );

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.LoginSchema.parse(credentials);

        // Sanitize inputs
        const sanitizedData = {
          email: InputSanitizer.sanitizeEmail(validatedData.email),
          password: validatedData.password, // Don't sanitize passwords
        };

        // Rate limiting check
        if (!RateLimiter.checkLimit("login", sanitizedData.email)) {
          const retryAfter = RateLimiter.getTimeUntilReset(
            "login",
            sanitizedData.email
          );
          throw new RateLimitError(
            `Too many login attempts. Please try again in ${Math.ceil(
              retryAfter / 60000
            )} minutes.`,
            retryAfter
          );
        }

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedData.email,
          password: sanitizedData.password,
        });

        if (error) {
          throw error;
        }

        // Set user and session
        setUser(data.user);
        setSession(data.session);

        // Fetch user profile
        if (data.user) {
          const userProfile = await fetchUserProfile(data.user.id);
          setProfile(userProfile);

          // If profile data is missing, try to update it from user metadata
          if (
            userProfile &&
            (!userProfile.firstName || !userProfile.lastName)
          ) {
            const metadata = data.user.user_metadata || {};
            if (metadata.first_name || metadata.last_name) {
              // Profile data exists in metadata, no need to update
              console.log("Profile data found in user metadata");
            }
          }
        }

        // Generate and store CSRF token
        const csrfToken = CSRFProtection.generateToken();
        CSRFProtection.storeToken(csrfToken);
      } catch (error) {
        handleError(error, "Login failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, fetchUserProfile]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.RegisterSchema.parse(data);

        // Sanitize inputs
        const sanitizedData = {
          email: InputSanitizer.sanitizeEmail(validatedData.email),
          password: validatedData.password,
          firstName: InputSanitizer.sanitizeFormInput(validatedData.firstName),
          lastName: InputSanitizer.sanitizeFormInput(validatedData.lastName),
          zipCode: validatedData.zipCode
            ? InputSanitizer.sanitizeFormInput(validatedData.zipCode)
            : undefined,
        };

        // Rate limiting check
        if (!RateLimiter.checkLimit("register", sanitizedData.email)) {
          const retryAfter = RateLimiter.getTimeUntilReset(
            "register",
            sanitizedData.email
          );
          throw new RateLimitError(
            `Too many registration attempts. Please try again in ${Math.ceil(
              retryAfter / 60000
            )} minutes.`,
            retryAfter
          );
        }

        // Register with Supabase
        const { data: authData, error } = await supabase.auth.signUp({
          email: sanitizedData.email,
          password: sanitizedData.password,
          options: {
            data: {
              first_name: sanitizedData.firstName,
              last_name: sanitizedData.lastName,
              zip_code: sanitizedData.zipCode,
              full_name:
                `${sanitizedData.firstName} ${sanitizedData.lastName}`.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (authData.user) {
          // Set user and session
          setUser(authData.user);
          setSession(authData.session);

          // Fetch user profile (data should be in user_metadata from signup)
          const userProfile = await fetchUserProfile(authData.user.id);
          setProfile(userProfile);

          // Generate and store CSRF token
          const csrfToken = CSRFProtection.generateToken();
          CSRFProtection.storeToken(csrfToken);
        }
      } catch (error) {
        handleError(error, "Registration failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, createUserProfile, fetchUserProfile]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      clearError();

      // Clear CSRF token
      CSRFProtection.clearToken();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      handleError(error, "Logout failed. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      handleError(error, "Token refresh failed");
      throw error;
    }
  }, [handleError]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<void> => {
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }

        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.ProfileUpdateSchema.parse(data);

        // Sanitize inputs
        const sanitizedData = {
          first_name: InputSanitizer.sanitizeFormInput(validatedData.firstName),
          last_name: InputSanitizer.sanitizeFormInput(validatedData.lastName),
          zip_code: validatedData.zipCode
            ? InputSanitizer.sanitizeFormInput(validatedData.zipCode)
            : undefined,
          bio: validatedData.bio
            ? XSSProtection.sanitizeRichText(validatedData.bio)
            : undefined,
          avatar_url: validatedData.avatar
            ? XSSProtection.sanitizeUrl(validatedData.avatar)
            : undefined,
          updated_at: new Date().toISOString(),
        };

        // Update profile in user metadata
        const { error } = await supabase.auth.updateUser({
          data: {
            first_name: sanitizedData.first_name,
            last_name: sanitizedData.last_name,
            zip_code: sanitizedData.zip_code,
            bio: sanitizedData.bio,
            avatar_url: sanitizedData.avatar_url,
            full_name:
              `${sanitizedData.first_name} ${sanitizedData.last_name}`.trim(),
          },
        });

        if (error) {
          throw new Error(`Failed to update profile: ${error.message}`);
        }

        // Update local profile state
        const updatedProfile = await fetchUserProfile(user.id);
        setProfile(updatedProfile);
      } catch (error) {
        handleError(error, "Profile update failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, handleError, clearError, fetchUserProfile]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.PasswordResetSchema.parse({
          email,
        });

        // Sanitize email
        const sanitizedEmail = InputSanitizer.sanitizeEmail(
          validatedData.email
        );

        // Rate limiting check
        if (!RateLimiter.checkLimit("passwordReset", sanitizedEmail)) {
          const retryAfter = RateLimiter.getTimeUntilReset(
            "passwordReset",
            sanitizedEmail
          );
          throw new RateLimitError(
            `Too many password reset attempts. Please try again in ${Math.ceil(
              retryAfter / 60000
            )} minutes.`,
            retryAfter
          );
        }

        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(
          sanitizedEmail,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (error) {
          throw error;
        }
      } catch (error) {
        handleError(error, "Password reset failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  const confirmPasswordReset = useCallback(
    async (token: string, password: string): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.PasswordResetConfirmSchema.parse({
          token,
          password,
          confirmPassword: password,
        });

        // Update password
        const { error } = await supabase.auth.updateUser({
          password: validatedData.password,
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        handleError(
          error,
          "Password reset confirmation failed. Please try again."
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  // ============================================================================
  // INITIALIZATION AND SESSION MANAGEMENT
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (mounted) {
          setSession(session);
          if (session?.user) {
            setUser(session.user);
            const userProfile = await fetchUserProfile(session.user.id);
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session?.user?.id);

      setSession(session);
      if (session?.user) {
        setUser(session.user);
        const userProfile = await fetchUserProfile(session.user.id);
        setProfile(userProfile);

        // If this is a sign up event and profile data is missing, try to update it
        if (
          event === "SIGNED_UP" &&
          userProfile &&
          (!userProfile.firstName || !userProfile.lastName)
        ) {
          console.log(
            "User signed up but profile data missing, will be updated on next login"
          );
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    resetPassword,
    confirmPasswordReset,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
