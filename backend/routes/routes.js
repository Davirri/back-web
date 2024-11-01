const express = require('express'); // Importamos Express para manejar rutas y middleware
const bcrypt = require('bcryptjs'); // Importamos bcrypt para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Importamos jwt para gestionar tokens de autenticación
const { PrismaClient } = require('@prisma/client'); // Importamos Prisma Client para interactuar con la base de datos
const authenticate = require('../middleware/authenticate'); // Middleware personalizado para autenticar usuarios

const router = express.Router(); 
const prisma = new PrismaClient(); // Instancia Prisma para acceder a los modelos de la base de datos

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res, next) => {
  const { username, password, email } = req.body;

  // Validamos que todos los campos necesarios estén presentes
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Faltan datos para registrar el usuario.' });
  }

  try {
    // Encriptamos la contraseña del usuario antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);
    // Creamos un nuevo usuario en la base de datos
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, email },
    });
    res.status(201).json(user); 
  } catch (error) {
    console.error('Error al registrar usuario:', error); // Manejo de errores de registro
    next(error); // Pasa el error al siguiente middleware de manejo de errores
  }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  // Verificamos que se hayan proporcionado nombre de usuario y contraseña
  if (!username || !password) {
    return res.status(400).json({ error: 'Debe proporcionar un nombre de usuario y una contraseña.' });
  }

  try {
    // Buscamos el usuario en la base de datos por su nombre de usuario
    const user = await prisma.user.findUnique({ where: { username } });

    // Verificamos que el usuario exista y que la contraseña sea correcta
    if (user && await bcrypt.compare(password, user.password)) {
      // Generamos un token JWT con la información del usuario
      const token = jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Se establece la duración del token a 1 hora
      );

      res.json({ token, isAdmin: user.isAdmin }); // Devolvemos el token y el rol de administrador
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas.' });
    }
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    next(error);
  }
});

// Ruta para obtener productos
router.get('/products', async (req, res, next) => {
  try {
    // Obtenemos todos los productos de la base de datos
    const products = await prisma.product.findMany();
    res.json(products); // Devolvemos la lista de productos
  } catch (error) {
    console.error('Error al obtener productos:', error);
    next(error);
  }
});

// Ruta protegida para añadir productos
router.post('/products/add', authenticate, async (req, res, next) => {
  // Verificamos que el usuario sea administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden añadir productos.' });
  }

  const { name, description, price, image } = req.body;

  // Validamos que se proporcionen los datos necesarios
  if (!name || !description || !price) {
    return res.status(400).json({ error: 'Faltan datos para añadir el producto.' });
  }

  try {
    // Convertimos el precio a número y verifica que sea válido
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({ error: 'El precio debe ser un número válido.' });
    }

    // Creamos un nuevo producto en la base de datos asociado al usuario actual
    const newProduct = await prisma.product.create({
      data: { name, description, price: parsedPrice, image, userId: req.user.id },
    });

    res.status(201).json(newProduct); 
  } catch (error) {
    console.error('Error al añadir el producto:', error);
    next(error);
  }
});

// Ruta protegida para editar productos
router.put('/products/:id', authenticate, async (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden editar productos.' });
  }

  const { id } = req.params;
  const { name, description, price, image } = req.body;

  // Verificamos que al menos un campo esté presente para la edición
  if (!name && !description && !price && !image) {
    return res.status(400).json({ error: 'Debes proporcionar al menos un campo para editar el producto.' });
  }

  try {
    // Preparamos los datos para actualizar en la base de datos
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'El precio debe ser un número válido.' });
      }
      updateData.price = parsedPrice;
    }
    if (image) updateData.image = image;

    // Actualizamos el producto en la base de datos
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedProduct); 
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    console.error('Error al editar producto:', error);
    next(error);
  }
});

// Ruta protegida para eliminar productos
router.delete('/products/:id', authenticate, async (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden eliminar productos.' });
  }

  const { id } = req.params;

  try {
    // Eliminamos el producto de la base de datos
    const product = await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Producto eliminado exitosamente', product });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    console.error('Error al eliminar producto:', error);
    next(error);
  }
});

// Ruta para obtener noticias
router.get('/news', async (req, res, next) => {
  try {
    const news = await prisma.news.findMany();
    res.json(news); 
  } catch (error) {
    console.error('Error al obtener noticias:', error);
    next(error);
  }
});

// Ruta para obtener artículos de merch
router.get('/merch', async (req, res, next) => {
  try {
    const merchItems = await prisma.merch.findMany();
    res.json(merchItems); 
  } catch (error) {
    console.error('Error al obtener artículos de merch:', error);
    next(error);
  }
});

// Ruta protegida para añadir un artículo de merch
router.post('/merch/add', authenticate, async (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden añadir artículos de merch.' });
  }

  const { name, description, price, image } = req.body;

  if (!name || !description || !price) {
    return res.status(400).json({ error: 'Faltan datos para añadir el artículo de merch.' });
  }

  try {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({ error: 'El precio debe ser un número válido.' });
    }

    const newMerch = await prisma.merch.create({
      data: { name, description, price: parsedPrice, image, userId: req.user.id },
    });

    res.status(201).json(newMerch); 
  } catch (error) {
    console.error('Error al añadir el artículo de merch:', error);
    next(error);
  }
});
// Rutas para gestionar artículos de merch
// Ruta protegida para editar un artículo de merch
router.put('/merch/:id', authenticate, async (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden editar artículos de merch.' });
  }

  const { id } = req.params;
  const { name, description, price, image } = req.body;

  // Verificamos que al menos un campo esté presente para la edición
  if (!name && !description && !price && !image) {
    return res.status(400).json({ error: 'Debes proporcionar al menos un campo para editar el artículo de merch.' });
  }

  try {
    // Preparamos los datos para actualizar en la base de datos
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'El precio debe ser un número válido.' });
      }
      updateData.price = parsedPrice;
    }
    if (image) updateData.image = image;

    // Actualizamos el artículo de merch en la base de datos
    const updatedMerch = await prisma.merch.update({
      where: { id },
      data: updateData,
    });

    res.json(updatedMerch); 
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Artículo de merch no encontrado' });
    }
    console.error('Error al editar artículo de merch:', error);
    next(error);
  }
});

// Ruta protegida para eliminar un artículo de merch
router.delete('/merch/:id', authenticate, async (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden eliminar artículos de merch.' });
  }

  const { id } = req.params;

  try {
    // Eliminamos el artículo de merch de la base de datos
    const merch = await prisma.merch.delete({
      where: { id },
    });

    res.json({ message: 'Artículo de merch eliminado exitosamente', merch });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Artículo de merch no encontrado' });
    }
    console.error('Error al eliminar artículo de merch:', error);
    next(error);
  }
});

module.exports = router; 
