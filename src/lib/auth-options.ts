import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { NextAuthConfig } from "next-auth";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateName } from "@/utils/generateName";
import { passwordService } from "@/utils/password";
import { EmailNotifications } from "@/utils/email-templates";

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
  trustHost: true,
  basePath: "/api/auth",
  pages: {
    signIn: "/signin",
    error: "/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Credentials provider for email/password authentication
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        try {
          // Find user by email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          if (!user[0]) {
            throw new Error("Invalid email or password");
          }

          const foundUser = user[0];

          // Check if this is a Google account (no password hash)
          if (foundUser.provider === 'google' || !foundUser.pwhash) {
            throw new Error("This email is associated with a Google account. Please sign in with Google instead.");
          }

          // Verify password
          const isValidPassword = await passwordService.verifyPassword(
            credentials.password as string,
            foundUser.pwhash
          );

          if (!isValidPassword) {
            throw new Error("Invalid email or password");
          }

          // Check if email is verified
          if (!foundUser.isEmailVerified) {
            throw new Error("Please verify your email before signing in");
          }

          // Return user object for NextAuth
          return {
            id: foundUser.uid.toString(),
            email: foundUser.email!,
            name: foundUser.username!,
            provider: 'credentials'
          };
        } catch (error) {
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle provider mismatch during OAuth signin
      if (account?.provider === 'google' && user?.email) {
        try {
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existingUser.length > 0 && existingUser[0].provider === 'email') {
            // User exists with email/password, prevent Google signin
            throw new Error("OAuthAccountNotLinked");
          }
        } catch (error) {
          if (error instanceof Error && error.message === "OAuthAccountNotLinked") {
            throw error;
          }
          throw new Error("Configuration");
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      // Handle OAuth signin (Google)
      if (user?.email && account && account.provider !== 'credentials') {
        try {
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          let dbUser = existingUser[0];

          if (!dbUser) {
            // Create new user for Google OAuth
            const inserted = await db
              .insert(users)
              .values({
                email: user.email,
                username: generateName(),
                provider: 'google',
                isEmailVerified: true, // Google accounts are pre-verified
                pwhash: null, // No password for OAuth users
              })
              .returning();
            dbUser = inserted[0];

            // Send welcome email to new Google OAuth user
            try {
              await EmailNotifications.sendWelcomeEmail(user.email, {
                platformUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
                dashboardUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`
              });
            } catch (error) {
              // Log welcome email error but don't fail the authentication
              if (process.env.NODE_ENV === 'development') {
                console.error("Failed to send welcome email to Google OAuth user:", error);
              }
            }
          }

          token.userId = dbUser.uid.toString();
        } catch (error) {
            // JWT callback error logged in development only
            if (process.env.NODE_ENV === 'development') {
              console.error("JWT callback error:", error);
            }
          throw new Error("Database error during authentication");
        }
      }
      
      // Handle credentials signin (email/password)
      if (user?.email && account && account.provider === 'credentials') {
        token.userId = user.id;
      }
      
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // If it's a signout, redirect to signin
      if (url.includes('/api/auth/signout')) {
        return baseUrl + '/signin';
      }
      // For sign-in, redirect to dashboard
      if (url.includes('/api/auth/signin') || url === baseUrl) {
        return baseUrl + "/dashboard";
      }
      // If URL starts with baseUrl, it's a relative redirect
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default redirect to dashboard
      return baseUrl + "/dashboard";
    },
  },
};

// Type augmentations for session and JWT
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }
}

// Export the NextAuth configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);