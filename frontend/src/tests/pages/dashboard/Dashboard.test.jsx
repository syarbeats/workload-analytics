import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import Dashboard from '../../../pages/dashboard/Dashboard';
import { vi } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  ...vi.importActual('../../../contexts/AuthContext'),
  useAuth: () => mockUseAuth(),
}));

// Mock data
const mockWorkloadStats = [
  {
    _id: '1',
    developer: {
      username: 'testuser',
      email: 'test@example.com',
    },
    workloadByType: [
      {
        taskType: 'development',
        totalHours: 20,
        taskCount: 5,
      },
      {
        taskType: 'bug-fix',
        totalHours: 10,
        taskCount: 3,
      },
    ],
  },
];

const mockProjectSummary = [
  {
    project: 'Project 1',
    totalHours: 30,
    taskCount: 8,
    completedTasks: 5,
    blockedTasks: 1,
    completionRate: 62.5,
  },
  {
    project: 'Project 2',
    totalHours: 20,
    taskCount: 5,
    completedTasks: 3,
    blockedTasks: 0,
    completionRate: 60,
  },
];

const renderDashboard = () => {
  mockUseAuth.mockReturnValue({
    user: {
      id: '1',
      username: 'testuser',
      role: 'user',
    },
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderDashboard();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders dashboard with data', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockProjectSummary });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
    });

    // Check project cards
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();

    // Check statistics
    expect(screen.getByText('30')).toBeInTheDocument(); // Total hours for Project 1
    expect(screen.getByText('62.5%')).toBeInTheDocument(); // Completion rate for Project 1
  });

  it('handles API error', async () => {
    const error = new Error('Failed to fetch data');
    axios.get.mockRejectedValue(error);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  it('processes and displays workload statistics correctly', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockProjectSummary });

    renderDashboard();

    await waitFor(() => {
      // Check task status distribution
      expect(screen.getByText(/tasks by status/i)).toBeInTheDocument();
      expect(screen.getByText(/tasks by priority/i)).toBeInTheDocument();
    });

    // Verify chart data is processed correctly
    const charts = screen.getAllByRole('presentation');
    expect(charts).toHaveLength(2); // Status and Priority charts
  });

  it('displays project summary cards with correct information', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockProjectSummary });

    renderDashboard();

    await waitFor(() => {
      // Project 1 details
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Total Hours: 30')).toBeInTheDocument();
      expect(screen.getByText('Tasks: 8')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate: 62.5%')).toBeInTheDocument();

      // Project 2 details
      expect(screen.getByText('Project 2')).toBeInTheDocument();
      expect(screen.getByText('Total Hours: 20')).toBeInTheDocument();
      expect(screen.getByText('Tasks: 5')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate: 60.0%')).toBeInTheDocument();
    });
  });

  it('makes correct API calls with date range', async () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockProjectSummary });

    renderDashboard();

    await waitFor(() => {
      // Verify workload stats API call
      expect(axios.get).toHaveBeenCalledWith('/api/workload/stats', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Verify project summary API call
      expect(axios.get).toHaveBeenCalledWith('/api/workload/project-summary', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
    });
  });

  it('handles empty data gracefully', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
    });

    // Should not show any project cards but still render the structure
    expect(screen.queryByText('Project 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Project 2')).not.toBeInTheDocument();

    // Charts should still be rendered but empty
    const charts = screen.getAllByRole('presentation');
    expect(charts).toHaveLength(2);
  });

  it('updates data periodically', async () => {
    vi.useFakeTimers();

    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockProjectSummary });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Project Overview')).toBeInTheDocument();
    });

    // Clear mock calls
    axios.get.mockClear();

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2); // Should make both API calls again
    });

    vi.useRealTimers();
  });
});
