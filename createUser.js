const db = require('./server/db');
const bcrypt = require('bcryptjs');

const username = 'admin';
const password = 'admin123'; // Cambia esto a una contraseña segura

// Hashear la contraseña
const hashedPassword = bcrypt.hashSync(password, 10);

// Insertar el usuario en la base de datos
db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function (err) {
    if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            console.log('El usuario "admin" ya existe.');
        } else {
            console.error('Error al crear el usuario:', err.message);
        }
    } else {
        console.log(`Usuario "${username}" creado con éxito. ID: ${this.lastID}`);
    }
    db.close();
});
