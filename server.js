const express = require('express'); 
const cors = require('cors'); 
const dotenv = require('dotenv'); // Importamos dotenv para manejar variables de entorno
const routes = require('./routes/routes'); 

dotenv.config(); 
const app = express(); 

app.use(cors()); 
app.use(express.json()); 

app.use('/', routes); // Usamos las rutas definidas en el archivo routes.js

// Middleware para manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).send('Cannot GET /');
});

const PORT = process.env.PORT || 5000; // Establecemos el puerto desde .env o usa 5000 por defecto
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`); // Iniciamos el servidor y muestra el puerto en consola
});
