## Overview

This project is a [Next.js](https://nextjs.org) application configured with [NextAuth.js](https://next-auth.js.org/) to support OAuth sign-in with Google and GitHub, password-based email login, and shareable public profiles powered by unique usernames stored in MongoDB.

## Prerequisites

- Node.js 20+
- MongoDB Atlas database (or compatible MongoDB instance)
- OAuth apps configured with Google and GitHub
- SMTP credentials (for sending email magic links)

## Environment Variables

Duplicate `.env.example` to `.env.local` and fill in the values before running the app.

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXTAUTH_URL` | Base URL of your app (e.g. `http://localhost:3000`). |
| `NEXTAUTH_SECRET` | Random string for signing cookies/JWT. Generate with `openssl rand -base64 32`. |
| `MONGODB_URI` | Connection string for your MongoDB deployment. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth credentials from the GitHub developer portal. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth credentials from Google Cloud Console. |
| `EMAIL_SERVER_HOST` / `EMAIL_SERVER_PORT` | SMTP server host and port. |
| `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` | SMTP login credentials. |
| `EMAIL_FROM` | Sender email address for magic links (e.g. `"Acme Auth" <no-reply@acme.com>`). |

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Use `/signup` to create an email/password account with a unique username (a verification link is sent automatically). The `/login` page offers Google, GitHub, and password options. Successful authentication redirects to `/dashboard` (protected by NextAuth middleware), where you can update your username and find your shareable profile link.

## Useful Commands

```bash
npm run dev    # Start the dev server with Turbopack
npm run build  # Build for production
npm run start  # Start the production server
npm run lint   # Run ESLint
```

## Deployment

Deploy with [Vercel](https://vercel.com/) or another platform that supports Next.js App Router. Ensure production environment variables match your `.env.local` configuration and that `NEXTAUTH_URL` points to the deployed domain.
