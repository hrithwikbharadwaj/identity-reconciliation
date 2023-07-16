import { Router } from 'express';
import Contact from '../controllers/Contact';

const api = Router().use(Contact);

export default Router().use('/api', api);
