import { NextFunction, Request, Response, Router } from 'express';
import auth from '../utils/auth';


const router = Router();

router.get('/ping', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {

    res.json({ ping: "pong"});
  } catch (error) {
    next(error);
  }
});


export default router;