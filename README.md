# Vayam V2 - Complete Authentication System

A Next.js 15 application with comprehensive authentication features including email/password, email/OTP, and Google OAuth integration.

## 🌟 Features

### Authentication Methods
- **Email & Password**: Traditional sign up/login with secure password hashing
- **Email & OTP**: Passwordless authentication using time-based OTP codes
- **Google OAuth**: One-click sign in with Google accounts

### Security Features
- ✅ Secure password hashing with bcryptjs
- ✅ OTP verification using Redis with expiration
- ✅ Email verification for account activation
- ✅ JWT-based session management
- ✅ Input validation and error handling
- ✅ Rate limiting for OTP requests

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui with Radix UI primitives
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Database**: PostgreSQL with Drizzle ORM
- **Cache/OTP Storage**: Redis (ioredis)
- **Email**: Nodemailer with Gmail integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Redis instance (Redis Cloud recommended)
- Gmail account for email sending

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Environment Setup**
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Redis (choose one method)
REDIS_URL="redis://default:password@host:port"
# OR
REDIS_PASSWORD="your-redis-password"

# Email
SENDER_EMAIL="your-gmail@gmail.com"
SENDER_PASS="your-gmail-app-password"
```

3. **Database Setup**
```bash
# Generate and run migrations
npx drizzle-kit generate
npx drizzle-kit migrate
```

4. **Start Development Server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 📱 Authentication Flow

### Sign Up Options

#### Option 1: Email & Password
1. User enters email + password
2. System validates password strength
3. Account created with hashed password
4. OTP sent to email for verification
5. User enters OTP to verify email
6. Account activated

#### Option 2: Email & OTP (Passwordless)
1. User enters email address
2. System sends 6-digit OTP to email
3. User enters OTP within 3 minutes
4. Account created and user signed in

### Login Options

#### Option 1: Email & Password
1. User enters email + password
2. System verifies credentials
3. User signed in with JWT session

#### Option 2: Email & OTP
1. User enters email address
2. System sends OTP if account exists
3. User enters OTP to sign in

#### Option 3: Google OAuth
1. User clicks "Continue with Google"
2. Redirected to Google OAuth
3. Google returns user profile
4. Account created/linked automatically
5. User signed in

## 🗄️ Database Schema

The application uses a simplified schema with your exact requirements:

```sql
-- Users table
CREATE TABLE users (
  uid SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  pwhash VARCHAR(255), -- bcrypt hash for email/password users
  provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google'
  is_email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Configuration

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins: `http://localhost:3000`
6. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Redis Setup
The application uses Redis for OTP storage with automatic expiration:
- OTPs expire after 3 minutes
- Rate limiting prevents spam
- Keys are automatically cleaned up

### Email Setup (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Create app password for "Mail"
3. Use the generated password as `SENDER_PASS`

## 📂 Project Structure

```
src/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── auth/              # Auth pages (signin, signup)
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── ui/                # Shadcn UI components
│   └── providers.tsx      # NextAuth session provider
├── db/
│   ├── schema.ts          # Database schema
│   └── drizzle.ts         # Database connection
├── lib/
│   ├── auth-options.ts    # NextAuth configuration
│   └── redis.ts           # Redis client
└── utils/
    ├── email.ts           # Email sending utility
    ├── otp.ts             # OTP management
    ├── password.ts        # Password hashing/validation
    └── generateName.ts    # Random username generator
```

## 🛡️ Security Features

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
- **OTP Security**: 6-digit codes with 3-minute expiration
- **Rate Limiting**: Prevents OTP spam and brute force attacks
- **Email Verification**: Required for account activation
- **Secure Sessions**: JWT-based with configurable expiration
- **Input Validation**: Comprehensive validation on all endpoints

## 🔌 API Endpoints

- `POST /api/auth/signup` - Create new account with email/password
- `POST /api/auth/send-otp` - Send OTP to email address
- `POST /api/auth/verify-otp` - Verify OTP and activate account
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

## 🎨 UI Components

Built with Shadcn/ui for consistent, accessible design:
- Responsive authentication forms
- Tab-based interface for different auth methods
- Error and success message handling
- Loading states and form validation
- Dark mode support (inherited from Tailwind)

## 📝 Development

### Adding New Authentication Providers
1. Install the provider package
2. Add provider configuration to `auth-options.ts`
3. Update environment variables
4. Test the integration

### Customizing UI
- Modify components in `src/components/ui/`
- Update global styles in `src/app/globals.css`
- Customize Tailwind config for theme changes

### Database Changes
1. Update schema in `src/db/schema.ts`
2. Generate migration: `npx drizzle-kit generate`
3. Apply migration: `npx drizzle-kit migrate`

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify `DATABASE_URL` is correct
- Ensure database is accessible
- Check if migrations have been applied

**OTP Not Sending**
- Verify Gmail credentials and app password
- Check Redis connection
- Ensure email format is valid

**Google OAuth Not Working**
- Verify client ID and secret
- Check authorized origins and redirect URIs
- Ensure Google+ API is enabled

**Redis Connection Issues**
- Test Redis connection with `REDIS_URL` or `REDIS_PASSWORD`
- Verify Redis instance is running
- Check network connectivity

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the documentation
3. Open an issue on GitHub
