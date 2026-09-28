import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { findUserById, upsertGoogleUser } from './db.js';
import { isAllowedEmail } from './allowed-email.js';

const SESSION_COOKIE = 'session';
// Sessions last one hour from sign-in and are not extended by activity.
const SESSION_MAX_AGE_SECONDS = 60 * 60;

const googleClient = new OAuth2Client(config.googleClientId);

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/'
};

/** Shape returned to the frontend; keeps internal columns out of responses. */
function toPublicUser(user, sessionExpiresAt) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    sessionExpiresAt: new Date(sessionExpiresAt * 1000).toISOString()
  };
}

/** Returns { user, expiresAt } for a valid, unexpired session cookie, else null. */
function currentSession(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { sub, exp } = jwt.verify(token, config.jwtSecret);
    const user = findUserById(Number(sub));
    return user ? { user, expiresAt: exp } : null;
  } catch {
    return null;
  }
}

/** Middleware for routes that need a signed-in user; sets req.user and req.sessionExpiresAt. */
export function requireAuth(req, res, next) {
  const session = currentSession(req);
  if (!session) return res.status(401).json({ error: 'Not signed in' });
  req.user = session.user;
  req.sessionExpiresAt = session.expiresAt;
  next();
}

export const authRouter = Router();

authRouter.get('/config', (req, res) => {
  res.json({ googleClientId: config.googleClientId });
});

authRouter.post('/google', async (req, res) => {
  const credential = req.body?.credential;
  if (typeof credential !== 'string' || !credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId
    });
    payload = ticket.getPayload();
  } catch (err) {
    console.warn(`Google ID token rejected: ${err.message}`);
    return res.status(401).json({ error: 'Invalid Google sign-in. Please try again.' });
  }

  if (!payload?.email_verified || !isAllowedEmail(payload.email, config.allowedEmailDomain)) {
    console.warn(`Sign-in refused for ${payload?.email ?? 'unknown email'}`);
    return res
      .status(403)
      .json({ error: `Only @${config.allowedEmailDomain} accounts can sign in.` });
  }

  const user = upsertGoogleUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified
  });

  const token = jwt.sign({ sub: String(user.id) }, config.jwtSecret, {
    expiresIn: SESSION_MAX_AGE_SECONDS
  });
  const { exp } = jwt.decode(token);
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_SECONDS * 1000 });
  res.json(toPublicUser(user, exp));
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(toPublicUser(req.user, req.sessionExpiresAt));
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(204).end();
});
