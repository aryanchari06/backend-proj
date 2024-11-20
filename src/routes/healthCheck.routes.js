import { Router } from 'express';
import {healthcheck} from '../controllers/healthCheck.controller.js'

const router = Router();

router.route('/').get(healthcheck);

export default router