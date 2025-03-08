import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma, Provider } from './database.js';
import { env } from './env.js';
import { socialLogin } from '../services/auth.service.js';
import bcrypt from 'bcrypt';
import { log } from '../utils/logger.js';

// Configure Local Strategy for username/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, user);
      } catch (error) {
        log.error('Local strategy error', { error: error instanceof Error ? error.message : String(error) });
        return done(error);
      }
    }
  )
);

// Configure Google Strategy for OAuth authentication
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${env.API_URL}${env.GOOGLE_CALLBACK_URL}`,
        scope: ['profile', 'email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('Email not provided by Google'));
          }

          const result = await socialLogin({
            provider: Provider.GOOGLE,
            providerId: profile.id,
            email,
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
          });

          return done(null, {
            ...result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
        } catch (error) {
          log.error('Google strategy error', { error: error instanceof Error ? error.message : String(error) });
          return done(error);
        }
      }
    )
  );
}

// Configure GitHub Strategy for OAuth authentication
if (env.GIT_CLIENT_ID && env.GIT_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GIT_CLIENT_ID,
        clientSecret: env.GIT_CLIENT_SECRET,
        callbackURL: `${env.API_URL}${env.GIT_CALLBACK_URL}`,
        scope: ['user:email'],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('Email not provided by GitHub'));
          }

          const result = await socialLogin({
            provider: Provider.GITHUB,
            providerId: profile.id,
            email,
            name: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
          });

          return done(null, {
            ...result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          });
        } catch (error) {
          log.error('GitHub strategy error', { error: error instanceof Error ? error.message : String(error) });
          return done(error);
        }
      }
    )
  );
}

export default passport;
