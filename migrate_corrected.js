// server/migrate_corrected.js

const db = require('./server/db');

// Función para agregar nuevas columnas si no existen
function addColumns(callback) {
    db.serialize(() => {
        // Agregar columna category_id
        db.run(`ALTER TABLE products ADD COLUMN category_id INTEGER`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('La columna category_id ya existe.');
                } else {
                    console.error('Error al agregar la columna category_id:', err.message);
                }
            } else {
                console.log('Columna category_id agregada.');
            }

            // Agregar columna location_id
            db.run(`ALTER TABLE products ADD COLUMN location_id INTEGER`, (err) => {
                if (err) {
                    if (err.message.includes('duplicate column name')) {
                        console.log('La columna location_id ya existe.');
                    } else {
                        console.error('Error al agregar la columna location_id:', err.message);
                    }
                } else {
                    console.log('Columna location_id agregada.');
                }

                callback();
            });
        });
    });
}

// Función para obtener categorías únicas
function getUniqueCategories(callback) {
    db.all(`SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''`, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener categorías únicas:', err.message);
            callback(err);
        } else {
            const categories = rows.map(row => row.category);
            callback(null, categories);
        }
    });
}

// Función para obtener ubicaciones únicas
function getUniqueLocations(callback) {
    db.all(`SELECT DISTINCT location FROM products WHERE location IS NOT NULL AND location != ''`, [], (err, rows) => {
        if (err) {
            console.error('Error al obtener ubicaciones únicas:', err.message);
            callback(err);
        } else {
            const locations = rows.map(row => row.location);
            callback(null, locations);
        }
    });
}

// Función para insertar categorías
function insertCategories(categories, callback) {
    const stmt = db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        categories.forEach(category => {
            stmt.run([category]);
        });
        db.run('COMMIT', (err) => {
            if (err) {
                console.error('Error al insertar categorías:', err.message);
                callback(err);
            } else {
                stmt.finalize();
                console.log('Categorías insertadas exitosamente.');
                callback(null);
            }
        });
    });
}

// Función para insertar ubicaciones
function insertLocations(locations, callback) {
    const stmt = db.prepare(`INSERT OR IGNORE INTO locations (name) VALUES (?)`);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        locations.forEach(location => {
            stmt.run([location]);
        });
        db.run('COMMIT', (err) => {
            if (err) {
                console.error('Error al insertar ubicaciones:', err.message);
                callback(err);
            } else {
                stmt.finalize();
                console.log('Ubicaciones insertadas exitosamente.');
                callback(null);
            }
        });
    });
}

// Función para actualizar products con claves foráneas
function updateProducts(callback) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
                console.error('Error al iniciar la transacción de actualización:', err.message);
                callback(err);
                return;
            }

            // Actualizar category_id
            db.run(`
                UPDATE products
                SET category_id = (
                    SELECT id FROM categories WHERE categories.name = products.category
                )
            `, [], function (err) {
                if (err) {
                    console.error('Error al actualizar category_id:', err.message);
                } else {
                    console.log(`category_id actualizados: ${this.changes} registros.`);
                }

                // Actualizar location_id
                db.run(`
                    UPDATE products
                    SET location_id = (
                        SELECT id FROM locations WHERE locations.name = products.location
                    )
                `, [], function (err) {
                    if (err) {
                        console.error('Error al actualizar location_id:', err.message);
                    } else {
                        console.log(`location_id actualizados: ${this.changes} registros.`);
                    }

                    db.run('COMMIT', (err) => {
                        if (err) {
                            console.error('Error al commitear la transacción de actualización:', err.message);
                            callback(err);
                        } else {
                            console.log('Productos actualizados con claves foráneas.');
                            callback(null);
                        }
                    });
                });
            });
        });
    });
}

// Función para crear tabla products_new con estructura correcta
function createProductsNew(callback) {
    db.run(`
        CREATE TABLE IF NOT EXISTS products_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_id INTEGER,
            quantity INTEGER,
            location_id INTEGER,
            FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
            FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE SET NULL
        )
    `, [], function (err) {
        if (err) {
            console.error('Error al crear products_new:', err.message);
            callback(err);
        } else {
            console.log('Tabla products_new creada.');
            callback(null);
        }
    });
}

// Función para copiar datos de products a products_new
function copyDataToProductsNew(callback) {
    db.run(`
        INSERT INTO products_new (id, name, category_id, quantity, location_id)
        SELECT id, name, category_id, quantity, location_id FROM products
    `, [], function (err) {
        if (err) {
            console.error('Error al copiar datos a products_new:', err.message);
            callback(err);
        } else {
            console.log('Datos copiados a products_new.');
            callback(null);
        }
    });
}

// Función para eliminar la tabla original products
function dropOldProductsTable(callback) {
    db.run(`DROP TABLE products`, [], function (err) {
        if (err) {
            console.error('Error al eliminar la tabla original products:', err.message);
            callback(err);
        } else {
            console.log('Tabla products original eliminada.');
            callback(null);
        }
    });
}

// Función para renombrar products_new a products
function renameProductsNew(callback) {
    db.run(`ALTER TABLE products_new RENAME TO products`, [], function (err) {
        if (err) {
            console.error('Error al renombrar products_new a products:', err.message);
            callback(err);
        } else {
            console.log('Tabla products_new renombrada a products.');
            callback(null);
        }
    });
}

// Ejecutar la migración paso a paso
function migrateDatabase() {
    addColumns(() => {
        getUniqueCategories((err, categories) => {
            if (err) return;

            insertCategories(categories, (err) => {
                if (err) return;

                getUniqueLocations((err, locations) => {
                    if (err) return;

                    insertLocations(locations, (err) => {
                        if (err) return;

                        updateProducts((err) => {
                            if (err) return;

                            createProductsNew((err) => {
                                if (err) return;

                                copyDataToProductsNew((err) => {
                                    if (err) return;

                                    dropOldProductsTable((err) => {
                                        if (err) return;

                                        renameProductsNew((err) => {
                                            if (err) return;

                                            console.log('Migración completada exitosamente.');
                                            db.close();
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

migrateDatabase();
