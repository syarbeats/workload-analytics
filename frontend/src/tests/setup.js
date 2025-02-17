import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.matchMedia
global.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// Custom test utilities
export const mockAuthContext = (overrides = {}) => ({
  user: {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    ...overrides.user,
  },
  loading: false,
  error: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  ...overrides,
});

export const mockWorkloadData = (overrides = {}) => ({
  id: '1',
  project: 'Test Project',
  taskName: 'Test Task',
  taskType: 'development',
  hoursSpent: 4,
  date: new Date().toISOString(),
  status: 'in-progress',
  priority: 'medium',
  description: 'Test description',
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  lastLogin: new Date().toISOString(),
  ...overrides,
});

// Custom matchers
expect.extend({
  toHaveBeenCalledWithMatch(received, ...expectedArgs) {
    const calls = received.mock.calls;
    const match = calls.some(call =>
      expectedArgs.every((arg, index) =>
        typeof arg === 'object'
          ? expect.objectContaining(arg).asymmetricMatch(call[index])
          : arg === call[index]
      )
    );

    return {
      pass: match,
      message: () =>
        `expected ${received.getMockName()} to have been called with arguments matching ${expectedArgs}`,
    };
  },
});

// Mock chart components
vi.mock('recharts', () => {
  const MockComponent = ({ children }) => children;
  return {
    ResponsiveContainer: MockComponent,
    LineChart: MockComponent,
    Line: MockComponent,
    XAxis: MockComponent,
    YAxis: MockComponent,
    CartesianGrid: MockComponent,
    Tooltip: MockComponent,
    Legend: MockComponent,
    BarChart: MockComponent,
    Bar: MockComponent,
    PieChart: MockComponent,
    Pie: MockComponent,
    Cell: MockComponent,
    AreaChart: MockComponent,
    Area: MockComponent,
  };
});

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(date => date.toISOString()),
  parseISO: vi.fn(str => new Date(str)),
  addDays: vi.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
  subDays: vi.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }),
}));
