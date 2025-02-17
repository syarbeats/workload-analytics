import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import MainLayout from '../../../components/layout/MainLayout';
import { vi } from 'vitest';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

// Mock useAuth with different user roles
const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  ...vi.importActual('../../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

const renderMainLayout = (userRole = 'user') => {
  mockUseAuth.mockReturnValue({
    user: {
      username: 'testuser',
      role: userRole,
    },
    logout: vi.fn(),
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('MainLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main layout structure', () => {
    renderMainLayout();

    expect(screen.getByText('Workload Analytics')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders navigation menu items', () => {
    renderMainLayout();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('shows user management for admin users', () => {
    renderMainLayout('admin');

    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('hides user management for non-admin users', () => {
    renderMainLayout('user');

    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });

  it('handles navigation to different routes', () => {
    renderMainLayout();

    fireEvent.click(screen.getByText('Analytics'));
    expect(mockNavigate).toHaveBeenCalledWith('/analytics');

    fireEvent.click(screen.getByText('Projects'));
    expect(mockNavigate).toHaveBeenCalledWith('/projects');
  });

  it('handles user menu interactions', async () => {
    const { logout } = mockUseAuth();
    renderMainLayout();

    // Open user menu
    const userMenuButton = screen.getByLabelText(/person/i);
    fireEvent.click(userMenuButton);

    // Check menu items
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    // Click profile
    fireEvent.click(screen.getByText('Profile'));
    expect(mockNavigate).toHaveBeenCalledWith('/profile');

    // Click logout
    fireEvent.click(screen.getByText('Logout'));
    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('handles mobile menu toggle', () => {
    renderMainLayout();

    // Find and click mobile menu button
    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    // Check if drawer is opened (implementation specific)
    const drawer = screen.getByRole('presentation');
    expect(drawer).toBeInTheDocument();

    // Click a menu item in mobile view
    fireEvent.click(screen.getByText('Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('updates page title based on current route', () => {
    // Mock window.location.pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/analytics' },
      writable: true,
    });

    renderMainLayout();
    expect(screen.getByRole('heading')).toHaveTextContent('Analytics');

    // Change location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/projects' },
      writable: true,
    });

    renderMainLayout();
    expect(screen.getByRole('heading')).toHaveTextContent('Projects');
  });

  it('handles responsive layout', () => {
    renderMainLayout();

    // Check if permanent drawer is visible on desktop
    const permanentDrawer = screen.getByRole('navigation');
    expect(permanentDrawer).toHaveStyle({ display: 'none' }); // Hidden on mobile

    // Check if mobile drawer is initially closed
    const mobileDrawer = screen.queryByRole('presentation');
    expect(mobileDrawer).not.toBeInTheDocument();

    // Open mobile menu
    fireEvent.click(screen.getByLabelText(/menu/i));
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('closes mobile menu when clicking outside', () => {
    renderMainLayout();

    // Open mobile menu
    fireEvent.click(screen.getByLabelText(/menu/i));
    const drawer = screen.getByRole('presentation');
    expect(drawer).toBeInTheDocument();

    // Click backdrop to close
    fireEvent.click(drawer.firstChild);
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });

  it('maintains drawer state across renders', () => {
    const { rerender } = renderMainLayout();

    // Open mobile menu
    fireEvent.click(screen.getByLabelText(/menu/i));
    expect(screen.getByRole('presentation')).toBeInTheDocument();

    // Rerender component
    rerender(
      <BrowserRouter>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </BrowserRouter>
    );

    // Drawer should maintain its state
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });
});
