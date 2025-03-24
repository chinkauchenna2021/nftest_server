import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

type AsyncMiddlewareHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next))
        .catch((error) => next(error));
    };
  };

  export const asyncMiddleware = (fn: AsyncMiddlewareHandler): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
      fn(req, res, next)
        .then(() => next())
        .catch(next);
    };
  };






  