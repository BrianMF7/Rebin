import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { cn } from "../../lib/utils";
import NotificationCenter from "../community/NotificationCenter";

// ============================================================================
// TYPES
// ============================================================================

interface MobileNavigationProps {
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiresAuth?: boolean;
}

interface MobileMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navigationItems: NavigationItem[];
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Icons.barChart,
    requiresAuth: true,
  },
  {
    id: "sorting",
    label: "Sorting",
    href: "/sorting",
    icon: Icons.recycle,
    requiresAuth: true,
  },
  {
    id: "challenges",
    label: "Challenges",
    href: "/challenges",
    icon: Icons.target,
    requiresAuth: true,
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    href: "/leaderboard",
    icon: Icons.trophy,
    requiresAuth: true,
  },
  {
    id: "achievements",
    label: "Achievements",
    href: "/achievements",
    icon: Icons.award,
    requiresAuth: true,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: Icons.users,
    requiresAuth: true,
  },
];

// ============================================================================
// MOBILE MENU OVERLAY COMPONENT
// ============================================================================

const MobileMenuOverlay: React.FC<MobileMenuOverlayProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  navigationItems,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleTabClick = useCallback(
    (item: NavigationItem) => {
      onTabChange(item.id);
      navigate(item.href);
      onClose();
    },
    [onTabChange, navigate, onClose]
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close menu"
            >
              <Icons.x className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Icons.users className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.user_metadata?.first_name}{" "}
                    {user.user_metadata?.last_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-primary-100 text-primary-800"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            {user ? (
              <>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    navigate("/profile");
                    onClose();
                  }}
                >
                  <Icons.settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Icons.logOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  fullWidth
                  onClick={() => {
                    navigate("/login");
                    onClose();
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    navigate("/register");
                    onClose();
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN MOBILE NAVIGATION COMPONENT
// ============================================================================

const MobileNavigation: React.FC<MobileNavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Add safety check for auth context
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    // Auth context not available yet, component will re-render when it becomes available
    console.log("Auth context not available in MobileNavigation");
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Update active tab based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = navigationItems.find(
      (item) => item.href === currentPath
    );
    if (currentItem) {
      setActiveTab(currentItem.id);
    }
  }, [location.pathname]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handleTabClick = useCallback(
    (item: NavigationItem) => {
      if (item.requiresAuth && !user) {
        navigate("/login");
        return;
      }

      setActiveTab(item.id);
      navigate(item.href);
    },
    [navigate, user]
  );

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Filter navigation items based on authentication
  const visibleItems = navigationItems.filter(
    (item) => !item.requiresAuth || user
  );

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {visibleItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                  isActive
                    ? "text-primary-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium mt-1">{item.label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={toggleMenu}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-colors",
              isMenuOpen
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            )}
            aria-label="More options"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <Icons.moreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <MobileMenuOverlay
        isOpen={isMenuOpen}
        onClose={closeMenu}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        navigationItems={navigationItems}
      />

      {/* Top Navigation Bar (for larger mobile screens) */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label="Open menu"
            >
              <Icons.menu className="w-5 h-5" />
            </Button>

            <h1 className="text-lg font-semibold text-gray-900">ReBin Pro</h1>
          </div>

          <div className="flex items-center space-x-2">
            <NotificationCenter />

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                aria-label="Profile"
              >
                <Icons.users className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
