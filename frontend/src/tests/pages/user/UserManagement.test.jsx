import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import UserManagement from '../../../pages/user/UserManagement';
import { vi } from 'vitest';
import axios from 'axios';
import userEvent from '@testing-library/user-event';

// Mock axios
vi.mock('axios');

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  ...vi.importActual('../../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

// Mock data
const mockUsers = {
  users: [
    {
      _id: '1',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
      isActive: true,
      lastLogin: '2025-02-17T00:00:00.000Z',
    },
    {
      _id: '2',
      username: 'user1',
      email: 'user1@example.com',
      role: 'user',
      isActive: true,
      lastLogin: '2025-02-16T00:00:00.000Z',
    },
  ],
  pagination: {
    total: 2,
    page: 1,
    pages: 1,
  },
};

const mockUserStats = {
  totalUsers: 2,
  activeUsers: 2,
  inactiveUsers: 0,
  roleDistribution: [
    {
      role: 'admin',
      count: 1,
      activeUsers: 1,
    },
    {
      role: 'user',
      count: 1,
      activeUsers: 1,
    },
  ],
};

const renderUserManagement = (currentUser = { _id: '1', role: 'admin' }) => {
  mockUseAuth.mockReturnValue({
    user: currentUser,
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('UserManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderUserManagement();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders user list with data', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });
  });

  it('handles user edit', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });
    axios.put.mockResolvedValueOnce({ data: { ...mockUsers.users[1], username: 'updated_user' } });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByLabelText(/edit/i);
    await user.click(editButtons[1]); // Edit second user

    // Update username
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);
    await user.type(usernameInput, 'updated_user');

    // Save changes
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('/api/users/2', expect.objectContaining({
        username: 'updated_user',
      }));
    });
  });

  it('handles user deletion', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });
    axios.delete.mockResolvedValueOnce({ data: { message: 'User deleted successfully' } });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    await user.click(deleteButtons[1]); // Delete second user

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/users/2');
    });
  });

  it('prevents editing/deleting current user', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/edit/i);
      const deleteButtons = screen.getAllByLabelText(/delete/i);

      // First user is current user (admin)
      expect(editButtons[0]).toBeDisabled();
      expect(deleteButtons[0]).toBeDisabled();

      // Second user can be edited/deleted
      expect(editButtons[1]).toBeEnabled();
      expect(deleteButtons[1]).toBeEnabled();
    });
  });

  it('displays user statistics', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('Total Users: 2')).toBeInTheDocument();
      expect(screen.getByText('Active Users: 2')).toBeInTheDocument();
      expect(screen.getByText('Inactive Users: 0')).toBeInTheDocument();
    });
  });

  it('handles pagination', async () => {
    const user = userEvent.setup();
    
    const mockPaginatedUsers = {
      ...mockUsers,
      pagination: {
        total: 15,
        page: 1,
        pages: 2,
      },
    };

    axios.get
      .mockResolvedValueOnce({ data: mockPaginatedUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('1-10 of 15')).toBeInTheDocument();
    });

    // Click next page
    const nextPageButton = screen.getByLabelText(/next page/i);
    await user.click(nextPageButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/users', {
        params: expect.objectContaining({
          page: 2,
        }),
      });
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByLabelText(/search/i);
    await user.type(searchInput, 'admin');

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/users', {
        params: expect.objectContaining({
          search: 'admin',
        }),
      });
    });
  });

  it('handles role filter', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    // Select role filter
    const roleSelect = screen.getByLabelText(/role/i);
    await user.click(roleSelect);
    await user.click(screen.getByText('Admin'));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/users', {
        params: expect.objectContaining({
          role: 'admin',
        }),
      });
    });
  });

  it('validates user input when editing', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockUsers })
      .mockResolvedValueOnce({ data: mockUserStats });

    renderUserManagement();

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });

    // Click edit button
    const editButtons = screen.getAllByLabelText(/edit/i);
    await user.click(editButtons[1]);

    // Clear username
    const usernameInput = screen.getByLabelText(/username/i);
    await user.clear(usernameInput);

    // Try to save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });
});
