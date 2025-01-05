import { Router } from 'express';

import statesController from './states.controller';

const router = Router();

router.get('/', statesController.getAll);

export default router;