import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { crearUsuario, buscarPorCorreo } from '../models/userModel.js';

dotenv.config();

// Registro de un nuevo usuario como alumno
export const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellidos, dni, email, contraseña } = req.body;

    // Validar que todos los campos necesarios están presentes
    if (!nombre || !apellidos || !dni || !email || !contraseña) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar si ya existe un usuario con el mismo correo o DNI
    const existente = await buscarPorCorreo(email);
    if (existente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Llamar al modelo para crear el usuario y registrarlo como alumno
    const nuevoUsuarioId = await crearUsuario(dni, nombre, apellidos, email, hashedPassword);

    // Enviar una respuesta de éxito
    res.status(201).json({
      mensaje: 'Usuario registrado correctamente como alumno',
      usuario: {
        id: nuevoUsuarioId,
        nombre,
        correo: email,
        rol: 'alumno'
      }
    });
  } catch (err) {
    console.error('Error en el registro de usuario:', err);
    res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
};

// Login de usuario
export const login = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    // Validar que se enviaron correo y contraseña
    if (!email || !contraseña) {
      return res.status(400).json({ error: 'El correo y la contraseña son obligatorios' });
    }

    // Buscar al usuario por su correo en la base de datos
    const usuario = await buscarPorCorreo(email);
    if (!usuario) {
      return res.status(404).json({ error: 'El correo no está registrado' });
    }

    // Comparar la contraseña enviada con la almacenada en la base de datos
    const passwordOK = await bcrypt.compare(contraseña, usuario.password);
    if (!passwordOK) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar el token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
        correo: usuario.correo
      },
      process.env.JWT_SECRET,
      { expiresIn: '4h' } // El token expira en 4 horas
    );

    // Enviar la respuesta con el token y la información del usuario
    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (err) {
    console.error('Error en el login:', err);
    res.status(500).json({ error: 'Error interno en el servidor durante el login' });
  }
};
