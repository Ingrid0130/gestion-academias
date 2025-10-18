import db from '../config/db.js';

// Modelo para crear un nuevo usuario y registrarlo como alumno
export const crearUsuario = async (dni, nombre, apellido, correo, hashedPassword) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    // 1. Registrar en la tabla Usuario (IdRol = 3 para Alumno)
    await connection.query(
      'CALL registrarUsuario(?, ?, ?, ?, ?, ?)',
      [dni, nombre, apellido, correo, hashedPassword, 3]
    );
    // 2. Registrar en la tabla Alumno
    await connection.query('CALL registrarAlumno(?)', [dni]);
    await connection.commit();
    // Devolver el DNI como identificador del nuevo usuario
    return dni;
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear el usuario:', error);
    throw new Error('Error al crear el usuario');
  } finally {
    connection.release();
  }
};

// Modelo para buscar un usuario por su correo electrónico
export const buscarPorCorreo = async (correo) => {
  try {
    // El procedimiento almacenado autenticarUsuario busca por correo y contraseña,
    // pero aquí solo necesitamos encontrar al usuario por su correo para luego
    // verificar la contraseña en el controlador.
    // Por simplicidad, y para evitar modificar ahora mismo el SP, lo llamamos
    // con una contraseña ficticia, ya que la verificación real se hace con bcrypt.
    const [results] = await db.query(
      'SELECT U.*, R.Nombre as Rol FROM Usuario U JOIN Rol R ON U.IdRol = R.IdRol WHERE U.Correo = ?',
      [correo]
    );
    
    if (results.length > 0) {
      const user = results[0];
      // Mapear los nombres de las columnas de la BD a los que espera el controlador
      return {
        id: user.DNI,
        nombre: user.Nombre,
        apellido: user.Apellido,
        correo: user.Correo,
        password: user.Contrasena, // Se devuelve el hash de la contraseña
        rol: user.Rol.toLowerCase() // Asegurarse de que el rol esté en minúsculas
      };
    }
    return null; // Retornar null si no se encuentra el usuario
  } catch (error) {
    console.error('Error al buscar usuario por correo:', error);
    throw new Error('Error en la base de datos al buscar usuario');
  }
};