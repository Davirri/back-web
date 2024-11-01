const express = require('express'); 
const cors = require('cors'); 
const dotenv = require('dotenv'); 
const routes = require('./routes/routes'); 

dotenv.config(); 
const app = express(); 

// Middleware
app.use(cors()); 
app.use(express.json()); 

// Rutas
app.use('/', routes); // Usamos las rutas definidas en el archivo routes.js

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).send('Cannot GET ' + req.originalUrl);
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000; // Establecemos el puerto desde .env o usa 5000 por defecto
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`); // Iniciamos el servidor y muestra el puerto en consola
});
