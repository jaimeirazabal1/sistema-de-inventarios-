// populateProducts.js

const db = require('./server/db');
const { faker } = require('@faker-js/faker'); // Importación correcta

const NUM_PRODUCTS = 100; // Número de productos a crear

function generateProduct() {
    return {
        name: faker.commerce.productName(),
        category: faker.commerce.department(),
        quantity: faker.number.int({ min: 1, max: 100 }),
        location: faker.location.streetAddress(),
    };
}

function populateProducts() {
    const products = [];
    for (let i = 0; i < NUM_PRODUCTS; i++) {
        products.push(generateProduct());
    }

    const stmt = db.prepare(`INSERT INTO products (name, category, quantity, location) VALUES (?, ?, ?, ?)`);
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        products.forEach(product => {
            stmt.run([product.name, product.category, product.quantity, product.location]);
        });
        db.run('COMMIT', (err) => {
            if (err) {
                console.error('Error al insertar productos:', err.message);
            } else {
                console.log(`${NUM_PRODUCTS} productos insertados exitosamente.`);
            }
            stmt.finalize();
            db.close();
        });
    });
}

populateProducts();
