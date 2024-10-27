const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const db = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// Configuración de CORS (opcionalmente puedes especificar orígenes permitidos)
app.use(cors({
    origin: '*', // Permitir todos los orígenes; considera restringir en producción
}));

app.use(express.json());

// Rutas
app.use('/api', routes);

// Crear un usuario inicial si no existe
const initialUsername = 'admin';
const initialPassword = 'admin123'; // Cambia esto a una contraseña segura

db.get(`SELECT * FROM users WHERE username = ?`, [initialUsername], (err, user) => {
    if (err) {
        console.error('Error al verificar el usuario inicial:', err.message);
    } else if (!user) {
        const hashedPassword = bcrypt.hashSync(initialPassword, 10);
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [initialUsername, hashedPassword], function (err) {
            if (err) {
                console.error('Error al crear el usuario inicial:', err.message);
            } else {
                console.log(`Usuario inicial "${initialUsername}" creado con éxito. Contraseña: ${initialPassword}`);
            }
        });
    } else {
        console.log(`El usuario inicial "${initialUsername}" ya existe.`);
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
