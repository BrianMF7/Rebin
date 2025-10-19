import React, { useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { SecuritySchemas, RateLimiter } from "../../lib/security";
import { Form, FormField, Input } from "../ui/form";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { Link } from "react-router-dom";
import { EarthBackground } from "../landingPage/earthBackground";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";

// ============================================================================
// LOGIN FORM COMPONENT
// ============================================================================

export const LoginForm: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const { showError, showSuccess } = useToastNotifications();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when form data changes
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }

      // Clear auth error
      if (error) {
        clearError();
      }
    },
    [errors, error, clearError]
  );

  const validateForm = useCallback(() => {
    try {
      SecuritySchemas.LoginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};

      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
      }

      setErrors(fieldErrors);
      return false;
    }
  }, [formData]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        await login(formData);
        showSuccess("Welcome back!", "You have successfully logged in.");
      } catch (error) {
        // Error is already handled by the auth context
        console.error("Login failed:", error);
      }
    },
    [formData, validateForm, login, showSuccess]
  );

  const handleSocialLogin = useCallback(
    async (provider: "google" | "github") => {
      try {
        // TODO: Implement social login with Supabase
        showError("Coming Soon", `${provider} login is not yet implemented.`);
      } catch (error) {
        showError(
          "Login Failed",
          `Failed to login with ${provider}. Please try again.`
        );
      }
    },
    [showError]
  );

  const getRemainingAttempts = useCallback(() => {
    return RateLimiter.getRemainingAttempts("login", formData.email);
  }, [formData.email]);

  const remainingAttempts = getRemainingAttempts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EarthBackground />
      <Header />

      <main className="flex-1 relative z-10 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border/20 p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
                <Icons.leaf className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in to your ReBin Pro account
              </p>
            </div>

            <Form
              onSubmit={handleSubmit}
              loading={isLoading}
              showActions={false}
            >
              <div className="space-y-6">
                {/* Email Field */}
                <FormField label="Email Address" error={errors.email} required>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    leftIcon={<Icons.mail className="w-4 h-4" />}
                    error={!!errors.email}
                    autoComplete="email"
                    required
                  />
                </FormField>

                {/* Password Field */}
                <FormField label="Password" error={errors.password} required>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Enter your password"
                    leftIcon={<Icons.lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <Icons.eyeOff className="w-4 h-4" />
                        ) : (
                          <Icons.eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                    error={!!errors.password}
                    autoComplete="current-password"
                    required
                  />
                </FormField>

                {/* Rate Limiting Warning */}
                {remainingAttempts < 3 && remainingAttempts > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex">
                      <Icons.alertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          {remainingAttempts} login attempt
                          {remainingAttempts !== 1 ? "s" : ""} remaining.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auth Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                      <Icons.alertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                    onClick={() => {
                      // TODO: Navigate to forgot password page
                      showError(
                        "Coming Soon",
                        "Password reset is not yet implemented."
                      );
                    }}
                  >
                    Forgot your password?
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || remainingAttempts === 0}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("google")}
                    disabled={isLoading}
                    leftIcon={<Icons.google className="w-4 h-4" />}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("github")}
                    disabled={isLoading}
                    leftIcon={<Icons.github className="w-4 h-4" />}
                  >
                    GitHub
                  </Button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:underline transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
