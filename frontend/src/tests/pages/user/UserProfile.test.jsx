import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import UserProfile from '../../../pages/user/UserProfile';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock useAuth
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  ...vi.importActual('../../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
};

const renderUserProfile = (error = null) => {
  mockUseAuth.mockReturnValue({
    user: mockUser,
    updateProfile: mockUpdateProfile,
    changePassword: mockChangePassword,
    error,
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <UserProfile />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user profile information', () => {
    renderUserProfile();

    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(`Role: ${mockUser.role.charAt(0).toUpperCase() + mockUser.role.slice(1)}`)).toBeInTheDocument();
  });

  it('allows editing profile information', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Find and fill form fields
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);

    await user.clear(usernameInput);
    await user.type(usernameInput, 'newusername');
    await user.clear(emailInput);
    await user.type(emailInput, 'newemail@example.com');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        username: 'newusername',
        email: 'newemail@example.com',
      });
    });
  });

  it('validates profile form inputs', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Clear required fields
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
    });
  });

  it('handles password change', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Open password dialog
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Fill password form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    await user.type(currentPasswordInput, 'currentpass');
    await user.type(newPasswordInput, 'newpass123');
    await user.type(confirmPasswordInput, 'newpass123');

    // Submit password change
    const submitButton = screen.getByRole('button', { name: /change password$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith('currentpass', 'newpass123');
    });
  });

  it('validates password change form', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Open password dialog
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Fill mismatched passwords
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    await user.type(newPasswordInput, 'newpass123');
    await user.type(confirmPasswordInput, 'differentpass');

    // Submit password change
    const submitButton = screen.getByRole('button', { name: /change password$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('displays success message after profile update', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Update profile
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, 'newusername');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('displays success message after password change', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Open password dialog
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Fill password form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

    await user.type(currentPasswordInput, 'currentpass');
    await user.type(newPasswordInput, 'newpass123');
    await user.type(confirmPasswordInput, 'newpass123');

    // Submit password change
    const submitButton = screen.getByRole('button', { name: /change password$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });
  });

  it('displays error messages from the server', () => {
    renderUserProfile('Server error message');

    expect(screen.getByText('Server error message')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Open password dialog
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    // Fill short password
    const newPasswordInput = screen.getByLabelText(/^new password$/i);
    await user.type(newPasswordInput, '12345');

    // Submit password change
    const submitButton = screen.getByRole('button', { name: /change password$/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/new password must be at least 6 characters long/i)).toBeInTheDocument();
    });
  });

  it('clears validation errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderUserProfile();

    // Trigger validation error
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters long/i)).toBeInTheDocument();
    });

    // Start typing should clear error
    await user.type(usernameInput, 'a');
    expect(screen.queryByText(/username must be at least 3 characters long/i)).not.toBeInTheDocument();
  });
});
