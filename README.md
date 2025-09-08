# Sintesa Frontend

A modern Next.js frontend application for the Sintesa Finance Dashboard with real-time messaging capabilities.

## Features

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components
- **Socket.io Client** for real-time communication
- **JWT Authentication** with cookie-based sessions
- **Real-time Messaging** system
- **Responsive Design** with mobile support

## Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Running Sintesa Backend (see backend README)

## Installation

1. **Clone and navigate to the frontend directory:**

   ```bash
   git clone <repository-url>
   cd sintesa-frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:

   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:88/api/v1
   NEXT_PUBLIC_SOCKET_URL=http://localhost:88
   NEXT_PUBLIC_SOCKET_PATH=/socket.io
   NEXT_PUBLIC_BASE_PATH=/v3/next
   JWT_SECRET=your-jwt-secret-matching-backend
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable                  | Description                             | Default                      |
| ------------------------- | --------------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL                    | `http://localhost:88/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL`  | Socket.IO server URL                    | `http://localhost:88`        |
| `NEXT_PUBLIC_SOCKET_PATH` | Socket.IO path                          | `/socket.io`                 |
| `NEXT_PUBLIC_BASE_PATH`   | Application base path                   | `/v3/next`                   |
| `JWT_SECRET`              | JWT secret for server-side verification | Required                     |
| `NODE_ENV`                | Environment mode                        | `development`                |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── auth/              # Authentication components
│   ├── messaging/         # Messaging components
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── shared/                # Shared types and constants
│   └── socket-events.ts   # Socket event definitions
├── utils/                 # Utility functions
└── data/                  # Static data files
```

## Key Features

### Authentication

- JWT-based authentication with HTTP-only cookies
- Automatic token refresh
- Protected routes with middleware
- Role-based access control

### Real-time Messaging

- Socket.io integration for real-time communication
- Conversation management
- Typing indicators
- Message read receipts
- Connection status monitoring

### UI Components

- Modern design with shadcn/ui
- Dark/light theme support
- Responsive layout
- Accessible components

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing

- `npm test` - Run Vitest in watch mode
- `npm run test:ui` - Run Vitest with UI
- `npm run test:run` - Single test run (CI-friendly)
- `npm run test:coverage` - Test run with coverage report

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Deployment

### Production Build

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm run start
   ```

### Environment Configuration

For production, update your environment variables:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.com
NODE_ENV=production
```

## Troubleshooting

### Common Issues

1. **Module resolution errors:**

   - Ensure the backend is running on the correct port
   - Check environment variables are set correctly

2. **Socket connection issues:**

   - Verify `NEXT_PUBLIC_SOCKET_URL` matches backend configuration
   - Check CORS settings in backend

3. **Authentication problems:**
   - Ensure JWT secrets match between frontend and backend
   - Check cookie settings and domain configuration

### Development Tips

- Use browser dev tools to monitor network requests
- Check the console for Socket.io connection logs
- Verify JWT tokens in browser cookies

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - utility-first CSS framework
- [Socket.io](https://socket.io/) - real-time communication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
