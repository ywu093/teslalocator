import { Request, Response, NextFunction } from 'express';

// Routes that are always public (no login required)
const PUBLIC_PATHS = [
  '/api/login',
  '/api/logout',
  '/login',
  '/health',
  '/api/auth/tesla/callback',
  '/.well-known/appspecific/com.tesla.3p.public-key.pem',
];

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Skip auth if no password is configured (open access)
  if (!process.env.APP_PASSWORD) {
    return next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some(p => req.path === p || req.path.startsWith(p))) {
    return next();
  }

  // Allow authenticated sessions
  if ((req.session as any).authenticated) {
    return next();
  }

  // API requests get 401 JSON
  if (req.path.startsWith('/api/')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Browser requests get redirected to login page
  res.redirect('/login');
};
