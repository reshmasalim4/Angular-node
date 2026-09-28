# Angular/Node project create / future edits integrated with claude code and co-piolet to understand and study new AI developments as a developer

- `frontend/` — Angular app (dev server on port 4200). Requests to `/api/*` are proxied to the backend.
- `backend/` — Express API (port 3000) with Google sign-in and a SQLite database (`backend/data/app.db`).

## Getting started

```bash
npm install
npm run install:all
cp backend/.env.example backend/.env   # then fill in the values (see below)
npm run dev
```

Open http://localhost:4200. You'll be sent to the login page; sign in with a Gmail account.

## Google sign-in setup (one time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create (or pick) a project.
2. **APIs & Services → OAuth consent screen**: choose **External**, fill in the app name and your email, and save. While the app is in **Testing**, add each Gmail address that should be able to sign in under **Test users**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:4200` and `http://localhost`
   - No redirect URIs are needed.
4. Copy the **Client ID** into `backend/.env` as `GOOGLE_CLIENT_ID`.
5. Set `JWT_SECRET` in `backend/.env` to a random value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

Only `@gmail.com` accounts are accepted (`ALLOWED_EMAIL_DOMAIN` in `backend/.env`).

Sessions last **1 hour** from sign-in and are not extended by activity. When the hour is up the app signs the user out and shows "Your session has expired" on the login page.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/auth/config` | Google client ID for the login button |
| POST | `/api/auth/google` | Exchange a Google ID token for a session cookie; saves the user |
| GET | `/api/auth/me` | Current user (including `sessionExpiresAt`), or 401 |
| POST | `/api/auth/logout` | Clear the session |

## Tests

```bash
npm test --prefix backend
npm test --prefix frontend -- --watch=false
```
