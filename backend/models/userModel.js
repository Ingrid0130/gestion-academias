import db from '../config/db.js';

/**
 * Busca un usuario por su dirección de correo electrónico.
 * @param {string} correo - El correo electrónico del usuario a buscar.
 * @returns {Promise<object|undefined>} El objeto del usuario si se encuentra, de lo contrario undefined.
 */
export const buscarPorCorreo = async (correo) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        u.DNI, 
        u.Nombre, 
        u.Apellido, 
        u.Correo, 
        u.Contrasena as password, 
        r.Nombre as rol 
       FROM Usuario u 
       JOIN Rol r ON u.IdRol = r.idRol 
       WHERE u.Correo = ?`,
      [correo]
    );
    return rows[0];
  } catch (error) {
    console.error("Error al buscar usuario por correo:", error);
    throw error;
  }
};

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {string} dni - DNI del usuario.
 * @param {string} nombre - Nombre del usuario.
 * @param {string} apellido - Apellido del usuario.
 * @param {string} correo - Correo electrónico del usuario.
 * @param {string} hashedPassword - Contraseña encriptada.
 * @param {string} rol - Rol del usuario ('alumno', 'docente', etc.).
 * @returns {Promise<string>} El DNI del usuario creado.
 */
export const crearUsuario = async (dni, nombre, apellido, correo, hashedPassword, rol) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener el ID del rol a partir de su nombre
    const [rolRows] = await connection.query('SELECT idRol FROM Rol WHERE Nombre = ?', [rol]);
    if (rolRows.length === 0) {
      throw new Error(`El rol '${rol}' no es válido.`);
    }
    const idRol = rolRows[0].idRol;

    // 2. Insertar el nuevo usuario en la tabla Usuario
    await connection.query(
      'INSERT INTO Usuario (DNI, Nombre, Apellido, Correo, Contrasena, IdRol) VALUES (?, ?, ?, ?, ?, ?)',
      [dni, nombre, apellido, correo, hashedPassword, idRol]
    );

    // 3. Insertar en la tabla específica del rol (Alumno, Docente, etc.)
    if (rol === 'alumno') {
      await connection.query('INSERT INTO Alumno (DNI) VALUES (?)', [dni]);
    } else if (rol === 'docente') {
      await connection.query('INSERT INTO Docente (DNI) VALUES (?)', [dni]);
    } else if (rol === 'administrador') {
        await connection.query('INSERT INTO Administrador (DNI) VALUES (?)', [dni]);
    }
    // Si hay más roles, se añadirían aquí con `else if`

    await connection.commit();
    return dni; // Devolvemos el DNI como identificador

  } catch (error) {
    await connection.rollback();
    console.error("Error al crear usuario:", error);
    // Lanza el error para que el controlador lo capture
    throw error;
  } finally {
    connection.release();
  }
};

