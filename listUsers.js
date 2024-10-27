const db = require('./server/db');

db.all(`SELECT id, username FROM users`, [], (err, rows) => {
    if (err) {
        console.error('Error al obtener los usuarios:', err.message);
    } else {
        console.log('Usuarios registrados:');
        rows.forEach((row) => {
            console.log(`ID: ${row.id}, Usuario: ${row.username}`);
        });
    }
    db.close();
});
