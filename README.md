# Workload Analytics Dashboard

A comprehensive dashboard for monitoring and analyzing developer workload, featuring project tracking, task management, and detailed analytics.

## Features

- 📊 Real-time workload analytics and visualization
- 👥 User management with role-based access control
- 📈 Project progress tracking and completion rates
- 🔒 Secure authentication and authorization
- 📱 Responsive design for all devices
- 📋 Detailed task and time tracking
- 📉 Custom date range filtering
- 📊 Multiple chart types for data visualization

## Tech Stack

### Frontend
- React.js with Vite
- Material-UI (MUI) for components
- Recharts for data visualization
- React Router for navigation
- Axios for API requests
- Vitest for testing

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Jest for testing
- Express Validator for input validation

## Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- MongoDB >= 4.4

## Installation

1. Clone the repository:
```bash
git clone https://github.com/syarbeats/workload-analytics.git
cd workload-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=3000

# Frontend (.env)
VITE_API_URL=http://localhost:3000
```

## Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
# Frontend
npm run test:watch:frontend

# Backend
npm run test:watch:backend
```

View test coverage reports:
- Frontend: `frontend/coverage/index.html`
- Backend: `backend/coverage/lcov-report/index.html`

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend
- `npm test` - Run all tests
- `npm run test:coverage` - Generate test coverage reports
- `npm run lint` - Run linting for both projects
- `npm run lint:fix` - Fix linting issues
- `npm run seed` - Seed the database with sample data

### Frontend
- `npm run dev --workspace=frontend` - Start frontend development server
- `npm run build --workspace=frontend` - Build frontend for production
- `npm run test:watch --workspace=frontend` - Run frontend tests in watch mode
- `npm run test:coverage --workspace=frontend` - Generate frontend test coverage
- `npm run lint --workspace=frontend` - Run frontend linting

### Backend
- `npm run dev --workspace=backend` - Start backend development server
- `npm run test:watch --workspace=backend` - Run backend tests in watch mode
- `npm run test:coverage --workspace=backend` - Generate backend test coverage
- `npm run lint --workspace=backend` - Run backend linting
- `npm run seed --workspace=backend` - Seed database with sample data

## Project Structure

```
workload-analytics/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── tests/
│   │   └── utils/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── tests/
│   │   └── utils/
│   └── package.json
└── package.json
```

## Testing Strategy

### Frontend Tests
- Unit tests for components using React Testing Library
- Integration tests for complex interactions
- Context provider tests
- Route protection tests
- Form validation tests
- API interaction tests
- UI state management tests

### Backend Tests
- Unit tests for controllers and services
- Integration tests for API endpoints
- Authentication middleware tests
- Database model tests
- Input validation tests
- Error handling tests

## Code Coverage Requirements

- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and ensure they pass
4. Update documentation if needed
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
