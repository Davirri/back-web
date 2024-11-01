const express = require('express'); 
const cors = require('cors'); 
const dotenv = require('dotenv'); 
const routes = require('./routes/routes'); 

dotenv.config(); 
const app = express(); 

app.use(cors()); 
app.use(express.json()); 

app.use('/', routes); // Usamos las rutas definidas en el archivo routes.js

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err); // Imprimir el error en los logs
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`); 
});
