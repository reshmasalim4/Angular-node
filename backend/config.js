const required = ['GOOGLE_CLIENT_ID', 'JWT_SECRET'];
const missing = required.filter((name) => !process.env[name]);

if (missing.length) {
  console.error(
    `Missing required environment variable(s): ${missing.join(', ')}.\n` +
      'Copy backend/.env.example to backend/.env and fill in the values.'
  );
  process.exit(1);
}

export const config = {
  port: process.env.PORT || 3000,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  jwtSecret: process.env.JWT_SECRET,
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || 'gmail.com',
  dbPath: process.env.DB_PATH || 'data/app.db',
  isProduction: process.env.NODE_ENV === 'production'
};
