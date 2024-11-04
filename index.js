const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const routes = require('./routes/routes');

dotenv.config(); // Cargamos las variables de entorno
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI); 
    console.log('Conexión a MongoDB establecida');
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err.message);
    process.exit(1);
  }
};

// Conectamos a la base de datos
connectDB();

// Rutas
app.use('/', routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
