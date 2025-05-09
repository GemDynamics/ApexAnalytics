import { Request, Response, NextFunction } from 'express';

/**
 * Fehlerbehandlungs-Middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Fehler:', err);
  
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    error: 'Fehler bei der Verarbeitung',
    message: err.message || 'Ein unerwarteter Fehler ist aufgetreten.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}; 