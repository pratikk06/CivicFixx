# CivicFix

A public civic accountability platform that combines a social-media-style public feed with AI-powered civic issue analysis, community support, department routing, authority communication, and resolution tracking.

## Overview

- **Frontend**: React + Vite (JavaScript) with Tailwind CSS, React Router, TanStack Query, Lucide React.
- **Backend**: Express (JavaScript ES modules) with environment variable loading, CORS, structured error handling, and a health endpoint.
- **Database**: MongoDB Atlas (Mongoose) – to be added in later phases.
- **Auth & Storage**: Supabase Auth & Storage – to be integrated later.
- **AI**: Groq API – to be integrated later.

## Development

```bash
# Clone the repo
git clone <repo-url>
cd civicfix
```

### Backend

```bash
cd server
npm install
npm run dev   # starts the server on PORT (default 5000)
```

### Frontend

```bash
cd client
npm install
npm run dev   # starts Vite dev server (default http://localhost:5173)
```

The frontend expects the backend API at the URL defined in `client/.env.example`.

## Next Steps

- Implement database models, authentication, AI integration, and issue management in subsequent phases.
