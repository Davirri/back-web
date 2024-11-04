const express = require('express');
const bcrypt = require('bcryptjs'); // Para encriptar las contraseñas
const jwt = require('jsonwebtoken'); // Para generar y verificar tokens JWT
const { User, Product, News, Merch } = require('../models'); // Importamos los modelos de Mongoose
const authenticate = require('../middleware/authenticate'); // Middleware para autenticación
const mongoose = require('mongoose'); // Mongoose para interactuar con MongoDB

const router = express.Router(); // Creamos un enrutador de Express

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res, next) => {
  const { username, password, email } = req.body; // Extraemos datos del cuerpo de la petición

  // Verificamos que se proporcionen todos los campos necesarios
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Faltan datos para registrar el usuario.' });
  }

  try {
    // Encriptamos la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);
    // Creamos el nuevo usuario en la base de datos
    const user = await User.create({ username, password: hashedPassword, email });
    res.status(201).json(user); // Respondemos con el usuario creado
  } catch (error) {
    console.error('Error al registrar usuario:', error.message); // Registro de errores en la consola
    next(error); // Pasamos el error al siguiente middleware
  }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body; // Extraemos datos del cuerpo de la petición

  // Verificamos que se proporcionen todos los campos necesarios
  if (!username || !password) {
    return res.status(400).json({ error: 'Debe proporcionar un nombre de usuario y una contraseña.' });
  }

  try {
    // Buscamos al usuario en la base de datos
    const user = await User.findOne({ username });

    // Verificamos si el usuario existe y si la contraseña es correcta
    if (user && await bcrypt.compare(password, user.password)) {
      // Generamos un token JWT para el usuario
      const token = jwt.sign(
        { id: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET, // Usamos la clave secreta del entorno
        { expiresIn: '1h' } // El token expirará en 1 hora
      );

      return res.json({ token, isAdmin: user.isAdmin }); // Respondemos con el token y el estado de administrador
    } else {
      return res.status(401).json({ error: 'Credenciales incorrectas.' }); // Credenciales inválidas
    }
  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message);
    next(error);
  }
});

// Ruta para obtener productos
router.get('/products', async (req, res, next) => {
  try {
    // Obtenemos todos los productos y populamos el campo userId para obtener datos del usuario
    const products = await Product.find().populate('userId');
    res.json(products); // Respondemos con la lista de productos
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    next(error);
  }
});

// Ruta protegida para añadir productos
router.post('/products/add', authenticate, async (req, res, next) => {
  // Verificamos si el usuario es administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden añadir productos.' });
  }

  const { name, description, price, image } = req.body; // Extraemos datos del cuerpo de la petición

  // Verificamos que se proporcionen todos los campos necesarios
  if (!name || !description || !price) {
    return res.status(400).json({ error: 'Faltan datos para añadir el producto.' });
  }

  try {
    // Convertimos el precio a un número y verificamos su validez
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return res.status(400).json({ error: 'El precio debe ser un número válido.' });
    }

    // Creamos el nuevo producto en la base de datos
    const newProduct = await Product.create({
      name,
      description,
      price: parsedPrice,
      image,
      userId: req.user.id, // Asociamos el producto al usuario que lo crea
    });

    res.status(201).json(newProduct); // Respondemos con el producto creado
  } catch (error) {
    console.error('Error al añadir el producto:', error.message);
    next(error);
  }
});

// Ruta protegida para editar productos
router.put('/products/:id', authenticate, async (req, res, next) => {
  // Verificamos si el usuario es administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden editar productos.' });
  }

  const { id } = req.params; // Obtenemos el ID del producto a editar
  const { name, description, price, image } = req.body; // Extraemos datos del cuerpo de la petición

  // Verificamos que al menos uno de los campos para editar se haya proporcionado
  if (!name && !description && !price && !image) {
    return res.status(400).json({ error: 'Debes proporcionar al menos un campo para editar el producto.' });
  }

  try {
    const updateData = {}; // Objeto para almacenar los datos a actualizar
    if (name) updateData.name = name; // Agregamos el nombre si se proporcionó
    if (description) updateData.description = description; // Agregamos la descripción si se proporcionó
    if (price) {
      const parsedPrice = parseFloat(price); // Convertimos el precio a un número
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'El precio debe ser un número válido.' });
      }
      updateData.price = parsedPrice; // Agregamos el precio al objeto de actualización
    }
    if (image) updateData.image = image; // Agregamos la imagen si se proporcionó

    // Actualizamos el producto en la base de datos
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' }); // Producto no encontrado
    }

    res.json(updatedProduct); // Respondemos con el producto actualizado
  } catch (error) {
    console.error('Error al editar producto:', error.message);
    next(error);
  }
});

// Ruta protegida para eliminar productos
router.delete('/products/:id', authenticate, async (req, res, next) => {
  // Verificamos si el usuario es administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden eliminar productos.' });
  }

  const { id } = req.params; // Obtenemos el ID del producto a eliminar

  try {
    // Buscamos y eliminamos el producto de la base de datos
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' }); // Producto no encontrado
    }

    res.json({ message: 'Producto eliminado exitosamente', product }); // Confirmación de eliminación
  } catch (error) {
    console.error('Error al eliminar producto:', error.message);
    next(error);
  }
});

// Ruta para obtener noticias
router.get('/news', async (req, res, next) => {
  try {
    // Obtenemos todas las noticias de la base de datos
    const news = await News.find();
    res.json(news); // Respondemos con la lista de noticias
  } catch (error) {
    console.error('Error al obtener noticias:', error.message);
    next(error);
  }
});

// Ruta para obtener artículos de merch
router.get('/merch', async (req, res, next) => {
  try {
    // Obtenemos todos los artículos de merch de la base de datos
    const merchItems = await Merch.find();
    res.json(merchItems); // Respondemos con la lista de artículos de merch
  } catch (error) {
    console.error('Error al obtener artículos de merch:', error.message);
    next(error);
  }
});

// Ruta protegida para añadir un artículo de merch
router.post('/merch/add', authenticate, async (req, res, next) => {
  // Verificamos si el usuario es administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden añadir artículos de merch.' });
  }

  const { name, description, price, image } = req.body; // Extraemos datos del cuerpo de la petición

  // Verificamos que se proporcionen todos los campos necesarios
  if (!name || !description || !price) {
    return res.status(400).json({ error: 'Faltan datos para añadir el artículo de merch.' });
  }

  try {
    const parsedPrice = parseFloat(price); // Convertimos el precio a un número
    if (isNaN(parsedPrice)) {
      return res.status(400).json({ error: 'El precio debe ser un número válido.' });
    }

    // Creamos el nuevo artículo de merch en la base de datos
    const newMerch = await Merch.create({
      name,
      description,
      price: parsedPrice,
      image,
      userId: req.user.id, // Asociamos el artículo al usuario que lo crea
    });

    res.status(201).json(newMerch); // Respondemos con el artículo de merch creado
  } catch (error) {
    console.error('Error al añadir el artículo de merch:', error.message);
    next(error);
  }
});

// Ruta protegida para editar artículos de merch
router.put('/merch/:id', authenticate, async (req, res, next) => {
  // Verificamos si el usuario es administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden editar artículos de merch.' });
  }

  const { id } = req.params; // Obtenemos el ID del artículo de merch a editar
  const { name, description, price, image } = req.body; // Extraemos datos del cuerpo de la petición

  // Verificamos que al menos uno de los campos para editar se haya proporcionado
  if (!name && !description && !price && !image) {
    return res.status(400).json({ error: 'Debes proporcionar al menos un campo para editar el artículo de merch.' });
  }

  try {
    const updateData = {}; // Objeto para almacenar los datos a actualizar
    if (name) updateData.name = name; // Agregamos el nombre si se proporcionó
    if (description) updateData.description = description; // Agregamos la descripción si se proporcionó
    if (price) {
      const parsedPrice = parseFloat(price); // Convertimos el precio a un número
      if (isNaN(parsedPrice)) {
        return res.status(400).json({ error: 'El precio debe ser un número válido.' });
      }
      updateData.price = parsedPrice; // Agregamos el precio al objeto de actualización
    }
    if (image) updateData.image = image; // Agregamos la imagen si se proporcionó

    // Actualizamos el artículo de merch en la base de datos
    const updatedMerch = await Merch.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedMerch) {
      return res.status(404).json({ error: 'Artículo de merch no encontrado' }); // Artículo no encontrado
    }

    res.json(updatedMerch); // Respondemos con el artículo de merch actualizado
  } catch (error) {
    console.error('Error al editar artículo de merch:', error.message);
    next(error);
  }
});

// Ruta protegida para eliminar artículos de merch
router.delete('/merch/:id', authenticate, async (req, res, next) => {
  // Verificamos si el usuario es administrador
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Solo los administradores pueden eliminar artículos de merch.' });
  }

  const { id } = req.params; // Obtenemos el ID del artículo de merch a eliminar

  try {
    // Buscamos y eliminamos el artículo de merch de la base de datos
    const merchItem = await Merch.findByIdAndDelete(id);

    if (!merchItem) {
      return res.status(404).json({ error: 'Artículo de merch no encontrado' }); // Artículo no encontrado
    }

    res.json({ message: 'Artículo de merch eliminado exitosamente', merchItem }); // Confirmación de eliminación
  } catch (error) {
    console.error('Error al eliminar artículo de merch:', error.message);
    next(error);
  }
});

module.exports = router; // Exportamos el router para usarlo en otros archivos
