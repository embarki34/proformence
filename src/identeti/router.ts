import { Router } from 'express';

import identityController from './identety.controller';


const router = Router();
router.post('/login', identityController.login);
router.post('/refresh', identityController.refresh);
router.post('/logout', identityController.logout);
router.post('/register', identityController.register);
router.patch('/update', identityController.update);



export default router;