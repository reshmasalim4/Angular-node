import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { findUserById, upsertGoogleUser } from './db.js';
import { isAllowedEmail } from './allowed-email.js';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const googleClient = new OAuth2Client(config.googleClientId);

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/'
};

/** Shape returned to the frontend; keeps internal columns out of responses. */
function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at
  };
}

function currentUser(req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, config.jwtSecret);
    return findUserById(Number(sub)) ?? null;
  } catch {
    return null;
  }
}

/** Middleware for routes that need a signed-in user; sets req.user. */
export function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  req.user = user;
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
  } catch {
    return res.status(401).json({ error: 'Invalid Google sign-in. Please try again.' });
  }

  if (!payload?.email_verified || !isAllowedEmail(payload.email, config.allowedEmailDomain)) {
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

  const token = jwt.sign({ sub: String(user.id) }, config.jwtSecret, { expiresIn: '7d' });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE_MS });
  res.json(toPublicUser(user));
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(toPublicUser(req.user));
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
  res.status(204).end();
});
