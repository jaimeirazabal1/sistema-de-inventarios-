// server/migrate_corrected.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

async function migrateDatabase() {
    const dbPath = path.resolve(__dirname, 'inventory.db');
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error al conectar con la base de datos:', err.message);
            process.exit(1);
        }
    });

    // Promisificar métodos de la base de datos
    const dbRun = promisify(db.run.bind(db));
    const dbAll = promisify(db.all.bind(db));
    const dbGet = promisify(db.get.bind(db));

    try {
        // 1. Agregar columnas category_id y location_id si no existen
        console.log('Agregando columnas category_id y location_id...');
        try {
            await dbRun(`ALTER TABLE products ADD COLUMN category_id INTEGER`);
            console.log('Columna category_id agregada.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('La columna category_id ya existe.');
            } else {
                console.error('Error al agregar la columna category_id:', err.message);
            }
        }

        try {
            await dbRun(`ALTER TABLE products ADD COLUMN location_id INTEGER`);
            console.log('Columna location_id agregada.');
        } catch (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('La columna location_id ya existe.');
            } else {
                console.error('Error al agregar la columna location_id:', err.message);
            }
        }

        // 2. Crear tablas categories y locations si no existen
        console.log('Creando tablas categories y locations si no existen...');
        await dbRun(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )`);
        console.log('Tablas categories y locations listas.');

        // 3. Verificar existencia de columnas 'category' y 'location' en products
        const tableInfo = await dbAll(`PRAGMA table_info(products)`);

        const hasCategory = tableInfo.some(col => col.name === 'category');
        const hasLocation = tableInfo.some(col => col.name === 'location');

        let categories = [];
        let locations = [];

        if (hasCategory) {
            console.log('Obteniendo categorías únicas desde products.category...');
            const categoryRows = await dbAll(`SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''`);
            categories = categoryRows.map(row => row.category);
            console.log(`Encontradas ${categories.length} categorías únicas.`);
        } else {
            console.log('La columna category no existe. Se asignará una categoría por defecto.');
        }

        if (hasLocation) {
            console.log('Obteniendo ubicaciones únicas desde products.location...');
            const locationRows = await dbAll(`SELECT DISTINCT location FROM products WHERE location IS NOT NULL AND location != ''`);
            locations = locationRows.map(row => row.location);
            console.log(`Encontradas ${locations.length} ubicaciones únicas.`);
        } else {
            console.log('La columna location no existe. Se asignará una ubicación por defecto.');
        }

        // 4. Insertar categorías en categories
        if (categories.length > 0) {
            console.log('Insertando categorías en la tabla categories...');
            const insertCategoryStmt = db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`);
            const insertCategoryRun = promisify(insertCategoryStmt.run.bind(insertCategoryStmt));

            for (const category of categories) {
                await insertCategoryRun(category);
            }

            insertCategoryStmt.finalize();
            console.log('Categorías insertadas.');
        } else {
            // Insertar categoría por defecto
            console.log('Insertando categoría por defecto "Sin Categoría"...');
            await dbRun(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, ['Sin Categoría']);
            console.log('Categoría por defecto insertada.');
        }

        // 5. Insertar ubicaciones en locations
        if (locations.length > 0) {
            console.log('Insertando ubicaciones en la tabla locations...');
            const insertLocationStmt = db.prepare(`INSERT OR IGNORE INTO locations (name) VALUES (?)`);
            const insertLocationRun = promisify(insertLocationStmt.run.bind(insertLocationStmt));

            for (const location of locations) {
                await insertLocationRun(location);
            }

            insertLocationStmt.finalize();
            console.log('Ubicaciones insertadas.');
        } else {
            // Insertar ubicación por defecto
            console.log('Insertando ubicación por defecto "Sin Ubicación"...');
            await dbRun(`INSERT OR IGNORE INTO locations (name) VALUES (?)`, ['Sin Ubicación']);
            console.log('Ubicación por defecto insertada.');
        }

        // 6. Obtener ID de categoría por defecto
        let defaultCategory = null;
        const categoryRow = await dbGet(`SELECT id FROM categories WHERE name = ?`, ['Sin Categoría']);
        if (categoryRow) {
            defaultCategory = categoryRow.id;
        } else {
            throw new Error('No se pudo encontrar la categoría por defecto "Sin Categoría".');
        }

        // 7. Obtener ID de ubicación por defecto
        let defaultLocation = null;
        const locationRow = await dbGet(`SELECT id FROM locations WHERE name = ?`, ['Sin Ubicación']);
        if (locationRow) {
            defaultLocation = locationRow.id;
        } else {
            throw new Error('No se pudo encontrar la ubicación por defecto "Sin Ubicación".');
        }

        // 8. Actualizar category_id y location_id en products
        if (hasCategory) {
            console.log('Actualizando category_id en products...');
            await dbRun(`
                UPDATE products
                SET category_id = (
                    SELECT id FROM categories WHERE categories.name = products.category
                )
                WHERE category IS NOT NULL AND category != ''
            `);
            console.log('category_id actualizados.');
        }

        if (hasLocation) {
            console.log('Actualizando location_id en products...');
            await dbRun(`
                UPDATE products
                SET location_id = (
                    SELECT id FROM locations WHERE locations.name = products.location
                )
                WHERE location IS NOT NULL AND location != ''
            `);
            console.log('location_id actualizados.');
        }

        // 9. Asignar valores por defecto a productos con category_id o location_id NULL
        console.log('Asignando categoría por defecto a productos sin categoría...');
        await dbRun(`
            UPDATE products
            SET category_id = ?
            WHERE category_id IS NULL
        `, [defaultCategory]);

        console.log('Asignando ubicación por defecto a productos sin ubicación...');
        await dbRun(`
            UPDATE products
            SET location_id = ?
            WHERE location_id IS NULL
        `, [defaultLocation]);

        // 10. Crear nueva tabla products_new sin columnas category y location
        console.log('Creando tabla products_new...');
        await dbRun(`
            CREATE TABLE IF NOT EXISTS products_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category_id INTEGER,
                quantity INTEGER,
                location_id INTEGER,
                FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
                FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE SET NULL
            )
        `);
        console.log('Tabla products_new creada.');

        // 11. Copiar datos de products a products_new
        console.log('Copiando datos a products_new...');
        await dbRun(`
            INSERT INTO products_new (id, name, category_id, quantity, location_id)
            SELECT id, name, category_id, quantity, location_id FROM products
        `);
        console.log('Datos copiados a products_new.');

        // 12. Eliminar la tabla original products
        console.log('Eliminando tabla products original...');
        await dbRun(`DROP TABLE products`);
        console.log('Tabla products original eliminada.');

        // 13. Renombrar products_new a products
        console.log('Renombrando products_new a products...');
        await dbRun(`ALTER TABLE products_new RENAME TO products`);
        console.log('Tabla products_new renombrada a products.');

        console.log('Migración completada exitosamente.');
    } catch (err) {
        console.error('Error en la migración:', err.message);
    } finally {
        db.close();
    }
}

migrateDatabase();
