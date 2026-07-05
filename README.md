# Connect — Real-time Chat Application

A WhatsApp-style messaging app built with React, Node.js, Express, Socket.io, and PostgreSQL.

## Features

- **Authentication** — Phone/email OTP login with JWT cookies
- **Real-time chat** — 1:1 messaging with typing indicators, read receipts, reactions
- **Status** — 24-hour ephemeral stories (text, image, video)
- **Profile** — View/edit profile, contact profiles, online status
- **Settings** — Theme (light/dark/system), starred messages, logout
- **Chat tools** — Reply, forward, edit, pin, star, search, media gallery

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Zustand, Tailwind CSS v4, Socket.io-client |
| Backend | Express 5, Prisma 7, PostgreSQL, Socket.io, Cloudinary |
| Auth | JWT (httpOnly cookies), Twilio Verify, Nodemailer |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Cloudinary account (for media uploads)
- Twilio account (for phone OTP) or Gmail (for email OTP)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your environment variables in .env

npm install
npx prisma db push
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:5000

npm install
npm run dev
```

App runs on `http://localhost:5173`

## Project Structure

```
chat-app/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, rate limiting
│   ├── prisma/          # Database schema
│   ├── routes/          # API routes
│   ├── services/        # Socket.io, email, Twilio
│   └── utils/           # Helpers
└── frontend/
    └── src/
        ├── components/  # UI components
        ├── pages/       # Route pages
        ├── services/    # API & socket clients
        └── store/       # Zustand state
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/send-otp` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP & login |
| GET | `/api/auth/all-users` | Contact list |
| POST | `/api/chat/send-message` | Send message |
| GET | `/api/chat/get-messages/:id/messages` | Fetch messages |
| POST | `/api/story` | Create status |
| GET | `/api/story` | List statuses |

## Security

- JWT authentication on REST and Socket.io connections
- Helmet security headers
- Rate limiting on OTP and API routes
- HttpOnly cookies with SameSite/Secure in production
- Sender ID validation on message send

## License

MIT
