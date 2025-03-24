import { RequestHandler } from 'express';

import { User } from '@prisma/client'; 
import { Request } from 'express';

declare module 'express-serve-static-core' {
  interface RequestHandler<
    P = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery = Query,
    Locals extends Record<string, any> = Record<string, any>
  > {
    (
      req: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
      res: Response<ResBody, Locals>,
      next: NextFunction
    ): Promise<void> | void;
  }
}

declare module 'express-serve-static-core' {
    interface Request {
      user?: User;
    }
  
    interface Response {
      success(data: unknown): Response;
      error(message: string, status?: number): Response;
    }
  }