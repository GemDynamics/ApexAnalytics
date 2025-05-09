import { Request, Response, NextFunction } from 'express';

/**
 * Request-Logger-Middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
}; 