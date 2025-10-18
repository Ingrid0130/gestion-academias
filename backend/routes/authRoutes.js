import express from 'express';
import { registrarUsuario, login } from '../controllers/authController.js';

const router = express.Router();

// Ruta para el registro de nuevos usuarios
router.post('/registro', registrarUsuario);

// Ruta para el login de usuarios
router.post('/login', login);

export default router;
