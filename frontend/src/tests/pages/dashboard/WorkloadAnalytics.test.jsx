import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import WorkloadAnalytics from '../../../pages/dashboard/WorkloadAnalytics';
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

const mockDevelopers = {
  users: [
    { _id: '1', username: 'developer1' },
    { _id: '2', username: 'developer2' },
  ],
};

const mockWorkloads = {
  workloads: [
    {
      project: 'Project 1',
      taskName: 'Task 1',
      taskType: 'development',
      hoursSpent: 4,
      date: '2025-02-17T00:00:00.000Z',
      status: 'completed',
      priority: 'high',
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    pages: 1,
  },
};

const renderWorkloadAnalytics = () => {
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
        <WorkloadAnalytics />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('WorkloadAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderWorkloadAnalytics();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders analytics with data', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    renderWorkloadAnalytics();

    await waitFor(() => {
      expect(screen.getByText('Workload Timeline')).toBeInTheDocument();
      expect(screen.getByText('Workload by Type')).toBeInTheDocument();
    });
  });

  it('handles filter changes', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    renderWorkloadAnalytics();

    await waitFor(() => {
      expect(screen.getByLabelText(/developer/i)).toBeInTheDocument();
    });

    // Select a developer
    const developerSelect = screen.getByLabelText(/developer/i);
    await user.click(developerSelect);
    await user.click(screen.getByText('developer1'));

    // Click apply filters
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workload/stats', {
        params: expect.objectContaining({
          developerId: '1',
        }),
      });
    });
  });

  it('displays timeline chart correctly', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    renderWorkloadAnalytics();

    await waitFor(() => {
      const timelineChart = screen.getByRole('presentation', { name: /workload timeline/i });
      expect(timelineChart).toBeInTheDocument();
    });
  });

  it('displays workload by type chart correctly', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    renderWorkloadAnalytics();

    await waitFor(() => {
      const typeChart = screen.getByRole('presentation', { name: /workload by type/i });
      expect(typeChart).toBeInTheDocument();
    });
  });

  it('handles date range selection', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    renderWorkloadAnalytics();

    await waitFor(() => {
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    // Set date range
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    await user.clear(startDateInput);
    await user.type(startDateInput, '2025-02-01');
    await user.clear(endDateInput);
    await user.type(endDateInput, '2025-02-28');

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await user.click(applyButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/workload/stats', {
        params: expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String),
        }),
      });
    });
  });

  it('handles API errors gracefully', async () => {
    const error = new Error('Failed to fetch data');
    axios.get.mockRejectedValue(error);

    renderWorkloadAnalytics();

    await waitFor(() => {
      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument();
    });
  });

  it('processes and displays data correctly', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    renderWorkloadAnalytics();

    await waitFor(() => {
      // Check if data is processed and displayed
      expect(screen.getByText('development')).toBeInTheDocument();
      expect(screen.getByText('bug-fix')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument(); // Hours for development
      expect(screen.getByText('10')).toBeInTheDocument(); // Hours for bug-fix
    });
  });

  it('maintains filter state between renders', async () => {
    const user = userEvent.setup();
    
    axios.get
      .mockResolvedValueOnce({ data: mockWorkloadStats })
      .mockResolvedValueOnce({ data: mockDevelopers })
      .mockResolvedValueOnce({ data: mockWorkloads });

    const { rerender } = renderWorkloadAnalytics();

    await waitFor(() => {
      expect(screen.getByLabelText(/developer/i)).toBeInTheDocument();
    });

    // Select a developer
    const developerSelect = screen.getByLabelText(/developer/i);
    await user.click(developerSelect);
    await user.click(screen.getByText('developer1'));

    // Rerender component
    rerender(
      <BrowserRouter>
        <AuthProvider>
          <WorkloadAnalytics />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check if filter state is maintained
    await waitFor(() => {
      expect(screen.getByLabelText(/developer/i)).toHaveValue('1');
    });
  });
});
