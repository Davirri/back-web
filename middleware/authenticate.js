const jwt = require('jsonwebtoken'); // Aqui importamos la biblioteca jsonwebtoken

const authenticate = (req, res, next) => {
  // Obtenemos el token del encabezado 
  const token = req.headers.authorization?.split(' ')[1];
  
  // Si no hay token, respondemos con un error
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    // Verificamos el token usando la clave secreta y almacenamos los datos del usuario en req.user
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;

    // Llamamos a next() para pasar al siguiente middleware
    next();
  } catch (error) {
    // Si el token es inválido, respondemos con estado 403 
    res.status(403).json({ message: 'Token inválido' });
  }
};

module.exports = authenticate; // Exportamos el middleware para usarlo en otras partes de la aplicación
