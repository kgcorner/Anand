import { Router, type Request, type Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'anand-backend',
    timestamp: new Date().toISOString(),
  });
});
