import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import ProjectSummary from '../../../pages/dashboard/ProjectSummary';
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

const renderProjectSummary = () => {
  mockUseAuth.mockReturnValue({
    user: {
      id: '1',
      username: 'testuser',
      role: 'admin',
    },
  });

  return render(
    <BrowserRouter>
      <AuthProvider>
        <ProjectSummary />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProjectSummary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderProjectSummary();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders project summary with data', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      // Check summary cards
      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('Total Tasks')).toBeInTheDocument();
      expect(screen.getByText('Average Completion')).toBeInTheDocument();

      // Check project details
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });

  it('displays correct statistics', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      // Total hours (30 + 20)
      expect(screen.getByText('50.0')).toBeInTheDocument();
      // Total tasks (8 + 5)
      expect(screen.getByText('13')).toBeInTheDocument();
      // Average completion ((62.5 + 60) / 2)
      expect(screen.getByText('61.3%')).toBeInTheDocument();
    });
  });

  it('displays project hours distribution chart', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      expect(screen.getByText('Project Hours Distribution')).toBeInTheDocument();
      const chart = screen.getByRole('presentation');
      expect(chart).toBeInTheDocument();
    });
  });

  it('displays detailed project table', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      // Check table headers
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();

      // Check project data
      expect(screen.getByText('30.0')).toBeInTheDocument(); // Project 1 hours
      expect(screen.getByText('20.0')).toBeInTheDocument(); // Project 2 hours
      expect(screen.getByText('5')).toBeInTheDocument(); // Project 1 completed tasks
      expect(screen.getByText('3')).toBeInTheDocument(); // Project 2 completed tasks
    });
  });

  it('handles API error', async () => {
    const error = new Error('Failed to fetch data');
    axios.get.mockRejectedValue(error);

    renderProjectSummary();

    await waitFor(() => {
      expect(screen.getByText(/failed to load project summary/i)).toBeInTheDocument();
    });
  });

  it('displays progress bars correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(2); // One for each project

      // Check progress values
      expect(progressBars[0]).toHaveAttribute('aria-valuenow', '62.5');
      expect(progressBars[1]).toHaveAttribute('aria-valuenow', '60');
    });
  });

  it('makes API call with correct date range', async () => {
    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workload/project-summary', {
        params: {
          startDate: expect.any(String),
          endDate: expect.any(String),
        },
      });
    });
  });

  it('handles empty data gracefully', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderProjectSummary();

    await waitFor(() => {
      // Should still show structure but with zero/empty values
      expect(screen.getByText('Total Hours')).toBeInTheDocument();
      expect(screen.getByText('0.0')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  it('formats numbers correctly', async () => {
    const mockDataWithDecimals = [{
      ...mockProjectSummary[0],
      totalHours: 30.456,
      completionRate: 62.789,
    }];

    axios.get.mockResolvedValueOnce({ data: mockDataWithDecimals });

    renderProjectSummary();

    await waitFor(() => {
      expect(screen.getByText('30.5')).toBeInTheDocument(); // Rounded to 1 decimal
      expect(screen.getByText('62.8%')).toBeInTheDocument(); // Rounded to 1 decimal
    });
  });

  it('updates data periodically', async () => {
    vi.useFakeTimers();

    axios.get.mockResolvedValueOnce({ data: mockProjectSummary });

    renderProjectSummary();

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    // Clear mock calls
    axios.get.mockClear();

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });
});
