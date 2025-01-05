import { Router } from 'express';

import likesController from './like.controller';
// import { authenticateToken } from '../middleware/auth';


const router = Router();

router.post('/:worker_id', likesController.create);





export default router;