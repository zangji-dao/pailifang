import { Request, Response, NextFunction } from 'express';

function getAllowedOrigins(): Set<string> {
  const configured = process.env.CORS_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

  const defaults = process.env.NODE_ENV === 'production'
    ? []
    : [
        'http://localhost:5000',
        'http://localhost:3000',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:3000',
      ];

  if (process.env.APP_URL) {
    defaults.push(process.env.APP_URL);
  }

  return new Set([...defaults, ...configured]);
}

export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      res.status(403).end();
      return;
    }
    res.status(204).end();
    return;
  }

  next();
};
