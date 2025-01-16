import { Router } from 'express';

import workersController from './workers.controller';


const router = Router();

router.post('/', workersController.create);
router.get('/', workersController.getAll);
router.get('/:id', workersController.getById);
router.patch('/:id', workersController.update);
router.delete('/:id', workersController.delete);
router.post('/:id/changeStatus', workersController.changeStatus);



export default router;