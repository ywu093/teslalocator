import { Router, Request, Response } from 'express';

const router = Router();

// Serve the login page
router.get('/login', (req: Request, res: Response) => {
  if (!process.env.APP_PASSWORD) {
    return res.redirect('/');
  }
  if ((req.session as any).authenticated) {
    return res.redirect('/');
  }

  const error = req.query.error ? '<p class="error">Incorrect password. Please try again.</p>' : '';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tesla Location Tracker — Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1.75rem;
    }
    .logo svg { flex-shrink: 0; }
    .logo-text { font-size: 1.1rem; font-weight: 700; color: #1f2937; }
    .logo-sub { font-size: 0.8rem; color: #6b7280; }
    h1 { font-size: 1.3rem; font-weight: 700; color: #1f2937; margin-bottom: 0.25rem; }
    p.subtitle { font-size: 0.875rem; color: #6b7280; margin-bottom: 1.5rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
    input[type=password] {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.15s;
      margin-bottom: 1rem;
    }
    input[type=password]:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
    button {
      width: 100%;
      padding: 0.7rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    button:hover { background: #b91c1c; }
    .error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      border-radius: 8px;
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#dc2626">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.5c.548 0 1.088.04 1.618.118L12 9.5l-1.618-6.882A9.503 9.503 0 0112 2.5zm-3.5.75L12 13l3.5-9.75A9.5 9.5 0 0121.5 12c0 5.247-4.253 9.5-9.5 9.5S2.5 17.247 2.5 12a9.5 9.5 0 015-8.75z"/>
      </svg>
      <div>
        <div class="logo-text">Tesla Location Tracker</div>
        <div class="logo-sub">Private Access</div>
      </div>
    </div>
    <h1>Sign in</h1>
    <p class="subtitle">Enter your password to access the tracker.</p>
    ${error}
    <form method="POST" action="/api/login">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Enter password" autofocus autocomplete="current-password" required />
      <button type="submit">Sign in</button>
    </form>
  </div>
</body>
</html>`);
});

// Handle login form submission
router.post('/api/login', (req: Request, res: Response) => {
  const { password } = req.body;

  if (!process.env.APP_PASSWORD || password === process.env.APP_PASSWORD) {
    (req.session as any).authenticated = true;
    return res.redirect('/');
  }

  res.redirect('/login?error=1');
});

// Handle logout
router.post('/api/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

export default router;
