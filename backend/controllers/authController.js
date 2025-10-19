import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { crearUsuario, buscarPorCorreo } from '../models/userModel.js';

dotenv.config();

// Registro general de usuario
export const registrarUsuario = async (req, res) => {
  try {
    const { dni, nombre, apellido, correo, password, rol } = req.body;

    if (!dni || !nombre || !apellido || !correo || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Permitir registro solo de alumnos y docentes
    const rolesPermitidos = ['alumno', 'docente'];
    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ error: 'Rol no permitido para registro público' });
    }

    // Verificar si ya existe el correo
    const existente = await buscarPorCorreo(correo);
    
    if (existente) return res.status(400).json({ error: 'El correo ya está registrado' });

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const id = await crearUsuario(dni, nombre, apellido, correo, hashedPassword, rol);

    res.json({
      mensaje: 'Usuario registrado correctamente',
      usuario: { id, nombre, correo, rol }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login por rol
export const login = async (req, res) => {
  try {
    const { correo, password } = req.body;
    const rolRuta = req.params.rol; // alumno, docente, administrador

    const usuario = await buscarPorCorreo(correo);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Verificar rol
    if (usuario.rol !== rolRuta) {
      return res.status(403).json({ error: `No tiene permisos de ${rolRuta}` });
    }

    // Verificar contraseña
    const passwordOK = await bcrypt.compare(password, usuario.password);
    if (!passwordOK) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Generar token
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, correo: usuario.correo },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el login' });
  }
};
