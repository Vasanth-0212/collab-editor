import express from 'express';
import { register, login, googleUpsert } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleUpsert);

export default router;
