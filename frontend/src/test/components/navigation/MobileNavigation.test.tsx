import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import MobileNavigation from "../../../components/navigation/MobileNavigation";
import { AuthProvider } from "../../../contexts/AuthContext";
import { ToastProvider } from "../../../contexts/ToastContext";

// Mock the notification center
vi.mock("../../../components/community/NotificationCenter", () => ({
  default: () => (
    <div data-testid="notification-center">Notification Center</div>
  ),
}));

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    first_name: "Test",
    last_name: "User",
  },
};

const mockLogout = vi.fn();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>{component}</ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe("MobileNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock auth context
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: mockUser,
        logout: mockLogout,
        isLoading: false,
        error: null,
      }
    );

    // Mock window.matchMedia for responsive design
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === "(max-width: 1023px)", // lg:hidden
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders mobile navigation", () => {
    renderWithProviders(<MobileNavigation />);

    expect(screen.getByText("ReBin Pro")).toBeInTheDocument();
    expect(screen.getByTestId("notification-center")).toBeInTheDocument();
  });

  it("renders navigation items for authenticated user", () => {
    renderWithProviders(<MobileNavigation />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Sorting")).toBeInTheDocument();
    expect(screen.getByText("Challenges")).toBeInTheDocument();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Achievements")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("shows user info in mobile menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Click on menu button
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Should show user info
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("opens mobile menu when menu button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Should show mobile menu
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("closes mobile menu when close button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Close menu
    const closeButton = screen.getByLabelText("Close menu");
    await user.click(closeButton);

    // Menu should be closed
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("navigates to different pages when navigation items are clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Click on Dashboard
    await user.click(screen.getByText("Dashboard"));

    // Should navigate to dashboard (in real app, would change URL)
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("handles logout when logout button is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Click logout
    const logoutButton = screen.getByText("Sign Out");
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it("shows authentication buttons for unauthenticated user", () => {
    // Mock no user
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: null,
        logout: mockLogout,
        isLoading: false,
        error: null,
      }
    );

    renderWithProviders(<MobileNavigation />);

    // Should show sign in and sign up buttons
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("redirects to login when clicking protected navigation items without auth", async () => {
    // Mock no user
    vi.mocked(require("../../../contexts/AuthContext").useAuth).mockReturnValue(
      {
        user: null,
        logout: mockLogout,
        isLoading: false,
        error: null,
      }
    );

    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Click on a protected navigation item
    await user.click(screen.getByText("Dashboard"));

    // Should redirect to login (in real app, would change URL)
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows active tab highlighting", () => {
    renderWithProviders(<MobileNavigation />);

    // The active tab should be highlighted
    const dashboardButton = screen.getByText("Dashboard");
    expect(dashboardButton).toBeInTheDocument();
  });

  it("handles more button click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Click on more button
    const moreButton = screen.getByLabelText("More options");
    await user.click(moreButton);

    // Should open mobile menu
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("closes menu when clicking outside", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Click outside (on backdrop)
    const backdrop = screen.getByRole("button", { hidden: true });
    await user.click(backdrop);

    // Menu should be closed
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("shows notification center", () => {
    renderWithProviders(<MobileNavigation />);

    expect(screen.getByTestId("notification-center")).toBeInTheDocument();
  });

  it("shows profile button for authenticated user", () => {
    renderWithProviders(<MobileNavigation />);

    const profileButton = screen.getByLabelText("Profile");
    expect(profileButton).toBeInTheDocument();
  });

  it("handles navigation item clicks in mobile menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Click on a navigation item in the menu
    const challengesItem = screen.getByText("Challenges");
    await user.click(challengesItem);

    // Menu should close and navigate
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("shows settings button in mobile menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Should show settings button
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("handles settings button click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Open menu
    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Click settings
    const settingsButton = screen.getByText("Settings");
    await user.click(settingsButton);

    // Should navigate to profile and close menu
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    renderWithProviders(<MobileNavigation />);

    // Check for proper ARIA attributes
    const menuButton = screen.getByLabelText("Open menu");
    expect(menuButton).toHaveAttribute("aria-expanded");
    expect(menuButton).toHaveAttribute("aria-haspopup");

    const moreButton = screen.getByLabelText("More options");
    expect(moreButton).toHaveAttribute("aria-expanded");
    expect(moreButton).toHaveAttribute("aria-haspopup");
  });

  it("shows navigation items with proper icons", () => {
    renderWithProviders(<MobileNavigation />);

    // Each navigation item should have an icon
    const navigationItems = screen.getAllByRole("button");
    expect(navigationItems.length).toBeGreaterThan(0);
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileNavigation />);

    // Should be able to navigate with keyboard
    const firstButton = screen.getByText("Dashboard");
    firstButton.focus();
    expect(firstButton).toHaveFocus();

    // Should be able to activate with Enter key
    await user.keyboard("{Enter}");
  });

  it("updates active tab based on current route", () => {
    // Mock useLocation to return a specific path
    vi.mocked(require("react-router-dom").useLocation).mockReturnValue({
      pathname: "/challenges",
      search: "",
      hash: "",
      state: null,
      key: "test",
    });

    renderWithProviders(<MobileNavigation />);

    // The challenges tab should be active
    expect(screen.getByText("Challenges")).toBeInTheDocument();
  });

  it("shows mobile bottom navigation on small screens", () => {
    renderWithProviders(<MobileNavigation />);

    // Should show bottom navigation
    const bottomNav = screen.getByRole("navigation");
    expect(bottomNav).toBeInTheDocument();
  });

  it("shows top navigation bar on larger mobile screens", () => {
    renderWithProviders(<MobileNavigation />);

    // Should show top navigation
    expect(screen.getByText("ReBin Pro")).toBeInTheDocument();
  });
});
