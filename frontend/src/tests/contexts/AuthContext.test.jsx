import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Test component that uses auth context
const TestComponent = () => {
  const { user, login, logout, register, error } = useAuth();
  return (
    <div>
      {user && <div data-testid="user-info">{user.username}</div>}
      {error && <div data-testid="error-message">{error}</div>}
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register({ username: 'test', email: 'test@example.com', password: 'password' })}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides authentication state and methods', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    };

    const mockResponse = {
      data: {
        token: 'mock-token',
        user: mockUser,
      },
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.username);
    });

    expect(localStorage.getItem('token')).toBe('mock-token');
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer mock-token');
  });

  it('handles login error', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Invalid credentials',
        },
      },
    };

    axios.post.mockRejectedValueOnce(mockError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
    });
  });

  it('handles successful registration', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    };

    const mockResponse = {
      data: {
        token: 'mock-token',
        user: mockUser,
      },
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.username);
    });

    expect(localStorage.getItem('token')).toBe('mock-token');
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer mock-token');
  });

  it('handles registration error', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Email already exists',
        },
      },
    };

    axios.post.mockRejectedValueOnce(mockError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists');
    });
  });

  it('handles logout', async () => {
    // Setup initial authenticated state
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    };

    localStorage.setItem('token', 'mock-token');
    axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    axios.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toBeInTheDocument();
    });

    // Mock successful logout
    axios.post.mockResolvedValueOnce({});

    // Perform logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('loads user profile on mount if token exists', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
    };

    localStorage.setItem('token', 'mock-token');
    axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';
    axios.get.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent(mockUser.username);
    });
  });

  it('handles expired token', async () => {
    localStorage.setItem('token', 'expired-token');
    
    // Mock jwt-decode to simulate expired token
    vi.mock('jwt-decode', () => ({
      default: () => ({
        exp: Date.now() / 1000 - 3600, // 1 hour ago
      }),
    }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    });
  });
});
