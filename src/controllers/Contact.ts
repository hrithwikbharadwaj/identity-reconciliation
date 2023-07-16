import { NextFunction, Request, Response, Router } from 'express';
import auth from '../utils/auth';
import { getContactDetails, deleteAll } from '../services/Contact';

const router = Router();

router.post('/identify', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phoneNumber} = req.body;
    const result = await getContactDetails(email, phoneNumber);
    res.json(result);
  } catch (error) {
    next(error);
  }
});


export default router;