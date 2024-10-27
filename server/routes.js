// server/routes.js

const express = require('express');
const router = express.Router();
const db = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = 'tu_clave_secreta'; // Cambia esto a una clave más segura

// Middleware para autenticar tokens JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Ruta de registro de usuarios
router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`);
    stmt.run(username, hashedPassword, function (err) {
        if (err) {
            res.status(500).send({ error: 'Error al registrar el usuario' });
        } else {
            res.status(201).send({ id: this.lastID });
        }
    });
});

// Ruta de inicio de sesión
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err) {
            res.status(500).send({ error: 'Error en la base de datos' });
        } else if (!user) {
            res.status(401).send({ error: 'Usuario no encontrado' });
        } else {
            const passwordIsValid = bcrypt.compareSync(password, user.password);
            if (!passwordIsValid) {
                res.status(401).send({ error: 'Contraseña inválida' });
            } else {
                const token = jwt.sign({ username: user.username, id: user.id }, SECRET_KEY, { expiresIn: '1h' });
                res.status(200).send({ token });
            }
        }
    });
});

// Ruta para obtener todas las categorías
router.get('/categories', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM categories`, [], (err, rows) => {
        if (err) {
            res.status(500).send({ error: 'Error al obtener las categorías' });
        } else {
            res.status(200).send(rows);
        }
    });
});

// Ruta para agregar una nueva categoría
router.post('/categories', authenticateToken, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send({ error: 'El nombre de la categoría es requerido' });
    }

    const stmt = db.prepare(`INSERT INTO categories (name) VALUES (?)`);
    stmt.run(name, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).send({ error: 'La categoría ya existe' });
            } else {
                res.status(500).send({ error: 'Error al agregar la categoría' });
            }
        } else {
            res.status(201).send({ id: this.lastID, name });
        }
    });
});

// Ruta para obtener todas las ubicaciones
router.get('/locations', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM locations`, [], (err, rows) => {
        if (err) {
            res.status(500).send({ error: 'Error al obtener las ubicaciones' });
        } else {
            res.status(200).send(rows);
        }
    });
});

// Ruta para agregar una nueva ubicación
router.post('/locations', authenticateToken, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send({ error: 'El nombre de la ubicación es requerido' });
    }

    const stmt = db.prepare(`INSERT INTO locations (name) VALUES (?)`);
    stmt.run(name, function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).send({ error: 'La ubicación ya existe' });
            } else {
                res.status(500).send({ error: 'Error al agregar la ubicación' });
            }
        } else {
            res.status(201).send({ id: this.lastID, name });
        }
    });
});

// Ruta para obtener todos los productos con detalles de categoría y ubicación
router.get('/products', authenticateToken, (req, res) => {
    db.all(`
        SELECT products.id, products.name, categories.name AS category, products.quantity, locations.name AS location
        FROM products
        LEFT JOIN categories ON products.category_id = categories.id
        LEFT JOIN locations ON products.location_id = locations.id
    `, [], (err, rows) => {
        if (err) {
            res.status(500).send({ error: 'Error al obtener los productos' });
        } else {
            res.status(200).send(rows);
        }
    });
});

// Ruta para agregar un nuevo producto
router.post('/products', authenticateToken, (req, res) => {
    const { name, category, quantity, location } = req.body;

    if (!name || !quantity) {
        return res.status(400).send({ error: 'El nombre y la cantidad del producto son requeridos' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Obtener o crear la categoría
        db.get(`SELECT id FROM categories WHERE name = ?`, [category || 'Sin Categoría'], (err, categoryRow) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).send({ error: 'Error al obtener la categoría' });
            }

            let category_id = categoryRow ? categoryRow.id : null;

            if (!categoryRow && category) {
                // Crear la categoría si no existe
                db.run(`INSERT INTO categories (name) VALUES (?)`, [category], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).send({ error: 'Error al crear la categoría' });
                    }
                    category_id = this.lastID;
                    proceedWithLocation();
                });
            } else {
                proceedWithLocation();
            }

            function proceedWithLocation() {
                // Obtener o crear la ubicación
                db.get(`SELECT id FROM locations WHERE name = ?`, [location || 'Sin Ubicación'], (err, locationRow) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).send({ error: 'Error al obtener la ubicación' });
                    }

                    let location_id = locationRow ? locationRow.id : null;

                    if (!locationRow && location) {
                        // Crear la ubicación si no existe
                        db.run(`INSERT INTO locations (name) VALUES (?)`, [location], function (err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).send({ error: 'Error al crear la ubicación' });
                            }
                            location_id = this.lastID;
                            insertProduct();
                        });
                    } else {
                        insertProduct();
                    }

                    function insertProduct() {
                        // Insertar el producto
                        const stmt = db.prepare(`INSERT INTO products (name, category_id, quantity, location_id) VALUES (?, ?, ?, ?)`);
                        stmt.run(name, category_id, quantity, location_id, function (err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).send({ error: 'Error al agregar el producto' });
                            }

                            // Registrar la transacción
                            db.run(`INSERT INTO transactions (product_id, change) VALUES (?, ?)`, [this.lastID, quantity], (err) => {
                                if (err) {
                                    console.error('Error al registrar la transacción:', err.message);
                                    // No es crítico, así que no hacemos ROLLBACK
                                }
                                db.run('COMMIT');
                                res.status(201).send({ id: this.lastID });
                            });
                        });
                        stmt.finalize();
                    }
                });
            }
        });
    });
});

// Ruta para actualizar un producto
router.put('/products/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, location } = req.body;

    if (!name || !quantity) {
        return res.status(400).send({ error: 'El nombre y la cantidad del producto son requeridos' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Obtener o crear la categoría
        db.get(`SELECT id FROM categories WHERE name = ?`, [category || 'Sin Categoría'], (err, categoryRow) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).send({ error: 'Error al obtener la categoría' });
            }

            let category_id = categoryRow ? categoryRow.id : null;

            if (!categoryRow && category) {
                // Crear la categoría si no existe
                db.run(`INSERT INTO categories (name) VALUES (?)`, [category], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).send({ error: 'Error al crear la categoría' });
                    }
                    category_id = this.lastID;
                    proceedWithLocation();
                });
            } else {
                proceedWithLocation();
            }

            function proceedWithLocation() {
                // Obtener o crear la ubicación
                db.get(`SELECT id FROM locations WHERE name = ?`, [location || 'Sin Ubicación'], (err, locationRow) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).send({ error: 'Error al obtener la ubicación' });
                    }

                    let location_id = locationRow ? locationRow.id : null;

                    if (!locationRow && location) {
                        // Crear la ubicación si no existe
                        db.run(`INSERT INTO locations (name) VALUES (?)`, [location], function (err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).send({ error: 'Error al crear la ubicación' });
                            }
                            location_id = this.lastID;
                            updateProduct();
                        });
                    } else {
                        updateProduct();
                    }

                    function updateProduct() {
                        // Actualizar el producto
                        db.run(`
                            UPDATE products
                            SET name = ?, category_id = ?, quantity = ?, location_id = ?
                            WHERE id = ?
                        `, [name, category_id, quantity, location_id, id], function (err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).send({ error: 'Error al actualizar el producto' });
                            }

                            db.run('COMMIT');
                            res.status(200).send({ changes: this.changes });
                        });
                    }
                });
            }
        });
    });
});

// Ruta para eliminar un producto
router.delete('/products/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
        if (err) {
            res.status(500).send({ error: 'Error al eliminar el producto' });
        } else {
            res.status(200).send({ changes: this.changes });
        }
    });
});

// Ruta para sincronizar datos (simplificada)
router.post('/sync', authenticateToken, (req, res) => {
    const products = req.body;

    if (!Array.isArray(products)) {
        return res.status(400).send({ error: 'Los datos deben ser un arreglo de productos' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Limpiar la tabla products
        db.run(`DELETE FROM products`, [], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).send({ error: 'Error al limpiar la base de datos local' });
            } else {
                // Preparar la inserción de nuevos productos
                const stmt = db.prepare(`
                    INSERT INTO products (id, name, category_id, quantity, location_id)
                    VALUES (?, ?, ?, ?, ?)
                `);

                let insertErrors = [];

                // Función para manejar la inserción de cada producto
                const insertProduct = (product) => {
                    return new Promise((resolve, reject) => {
                        // Obtener o crear la categoría
                        db.get(`SELECT id FROM categories WHERE name = ?`, [product.category || 'Sin Categoría'], (err, categoryRow) => {
                            if (err) return reject(err);

                            let category_id = categoryRow ? categoryRow.id : null;

                            if (!categoryRow && product.category) {
                                // Crear la categoría si no existe
                                db.run(`INSERT INTO categories (name) VALUES (?)`, [product.category], function (err) {
                                    if (err) return reject(err);
                                    category_id = this.lastID;
                                    proceedWithLocation();
                                });
                            } else {
                                proceedWithLocation();
                            }

                            function proceedWithLocation() {
                                // Obtener o crear la ubicación
                                db.get(`SELECT id FROM locations WHERE name = ?`, [product.location || 'Sin Ubicación'], (err, locationRow) => {
                                    if (err) return reject(err);

                                    let location_id = locationRow ? locationRow.id : null;

                                    if (!locationRow && product.location) {
                                        // Crear la ubicación si no existe
                                        db.run(`INSERT INTO locations (name) VALUES (?)`, [product.location], function (err) {
                                            if (err) return reject(err);
                                            location_id = this.lastID;
                                            insertIntoProducts();
                                        });
                                    } else {
                                        insertIntoProducts();
                                    }

                                    function insertIntoProducts() {
                                        stmt.run([product.id, product.name, category_id, product.quantity, location_id], function (err) {
                                            if (err) {
                                                insertErrors.push({ product, error: err.message });
                                                resolve(); // Continuar con los demás productos
                                            } else {
                                                resolve();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                };

                // Insertar todos los productos secuencialmente
                const insertAll = async () => {
                    for (const product of products) {
                        await insertProduct(product);
                    }
                };

                insertAll().then(() => {
                    stmt.finalize();

                    if (insertErrors.length > 0) {
                        db.run('ROLLBACK');
                        res.status(500).send({ error: 'Errores al insertar algunos productos', details: insertErrors });
                    } else {
                        db.run('COMMIT');
                        res.status(200).send({ message: 'Sincronización completada exitosamente' });
                    }
                }).catch((err) => {
                    console.error('Error durante la sincronización:', err.message);
                    db.run('ROLLBACK');
                    res.status(500).send({ error: 'Error durante la sincronización', details: err.message });
                });
            }
        });
    });
});

module.exports = router;
