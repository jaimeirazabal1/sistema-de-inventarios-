// renderer.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    let token = localStorage.getItem('token') || null;

    // Elementos del DOM
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const appSection = document.getElementById('app-section');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const addProductForm = document.getElementById('addProductForm');
    const productsTableBody = document.querySelector('#productsTable tbody');
    const logoutBtn = document.getElementById('logoutBtn');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const searchInput = document.getElementById('searchInput');

    const categorySelect = document.getElementById('category');
    const locationSelect = document.getElementById('location');

    // Elementos del Modal de Edición
    const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));
    const editProductForm = document.getElementById('editProductForm');
    const editProductId = document.getElementById('editProductId');
    const editName = document.getElementById('editName');
    const editCategory = document.getElementById('editCategory');
    const editQuantity = document.getElementById('editQuantity');
    const editLocation = document.getElementById('editLocation');

    // Mostrar u ocultar secciones según el estado de autenticación
    function updateUI() {
        if (token) {
            loginSection.classList.add('hidden');
            registerSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            fetchCategories();
            fetchLocations();
            fetchProducts();
        } else {
            loginSection.classList.remove('hidden');
            registerSection.classList.add('hidden');
            appSection.classList.add('hidden');
        }
    }

    // Alternar a la sección de registro
    showRegisterBtn.addEventListener('click', () => {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    });

    // Alternar a la sección de inicio de sesión
    showLoginBtn.addEventListener('click', () => {
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    // Manejar el inicio de sesión
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        console.log(`Intentando iniciar sesión con Usuario: ${username}`);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log('Respuesta del servidor:', data);

            if (response.ok) {
                token = data.token;
                localStorage.setItem('token', token);
                updateUI();
            } else {
                alert(data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error en la solicitud de inicio de sesión:', error);
            alert('Error al iniciar sesión');
        }
    });

    // Manejar el registro de usuario
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.regUsername.value;
        const password = e.target.regPassword.value;

        console.log(`Intentando registrar Usuario: ${username}`);

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log('Respuesta del servidor (registro):', data);

            if (response.ok) {
                alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
                registerForm.reset();
                registerSection.classList.add('hidden');
                loginSection.classList.remove('hidden');
            } else {
                alert(data.error || 'Error al registrar el usuario');
            }
        } catch (error) {
            console.error('Error en la solicitud de registro:', error);
            alert('Error al registrar el usuario');
        }
    });

    // Manejar el cierre de sesión
    logoutBtn.addEventListener('click', () => {
        token = null;
        localStorage.removeItem('token');
        updateUI();
    });

    // Función para cargar categorías
    async function fetchCategories() {
        try {
            const response = await fetch(`${API_URL}/categories`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const categories = await response.json();

            // Limpiar el select
            categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });

            // Agregar opción para agregar nueva categoría
            const addCategoryOption = document.createElement('option');
            addCategoryOption.value = 'add_new';
            addCategoryOption.textContent = 'Agregar nueva categoría';
            categorySelect.appendChild(addCategoryOption);

            // Inicializar Select2
            initializeSelect2();

            // Manejar el cambio en el select de categoría
            categorySelect.removeEventListener('change', handleCategoryChange); // Evitar múltiples eventos
            categorySelect.addEventListener('change', handleCategoryChange);
        } catch (error) {
            console.error('Error al obtener las categorías:', error);
            alert('Error al obtener las categorías');
        }
    }

    // Función para manejar el cambio en el select de categoría
    function handleCategoryChange() {
        if (categorySelect.value === 'add_new') {
            const newCategory = prompt('Ingrese el nombre de la nueva categoría:');
            if (newCategory) {
                addNewCategory(newCategory);
            } else {
                // Si el usuario cancela o no ingresa nada, restablecer el select
                categorySelect.value = '';
            }
        }
    }

    // Función para agregar una nueva categoría
    async function addNewCategory(name) {
        try {
            const response = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Categoría agregada exitosamente');
                fetchCategories();
            } else {
                alert(data.error || 'Error al agregar la categoría');
                categorySelect.value = '';
            }
        } catch (error) {
            console.error('Error al agregar la categoría:', error);
            alert('Error al agregar la categoría');
            categorySelect.value = '';
        }
    }

    // Función para cargar ubicaciones
    async function fetchLocations() {
        try {
            const response = await fetch(`${API_URL}/locations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const locations = await response.json();

            // Limpiar el select
            locationSelect.innerHTML = '<option value="">Selecciona una ubicación</option>';

            locations.forEach(location => {
                const option = document.createElement('option');
                option.value = location.name;
                option.textContent = location.name;
                locationSelect.appendChild(option);
            });

            // Agregar opción para agregar nueva ubicación
            const addLocationOption = document.createElement('option');
            addLocationOption.value = 'add_new';
            addLocationOption.textContent = 'Agregar nueva ubicación';
            locationSelect.appendChild(addLocationOption);

            // Inicializar Select2
            initializeSelect2();

            // Manejar el cambio en el select de ubicación
            locationSelect.removeEventListener('change', handleLocationChange); // Evitar múltiples eventos
            locationSelect.addEventListener('change', handleLocationChange);
        } catch (error) {
            console.error('Error al obtener las ubicaciones:', error);
            alert('Error al obtener las ubicaciones');
        }
    }

    // Función para manejar el cambio en el select de ubicación
    function handleLocationChange() {
        if (locationSelect.value === 'add_new') {
            const newLocation = prompt('Ingrese el nombre de la nueva ubicación:');
            if (newLocation) {
                addNewLocation(newLocation);
            } else {
                // Si el usuario cancela o no ingresa nada, restablecer el select
                locationSelect.value = '';
            }
        }
    }

    // Función para agregar una nueva ubicación
    async function addNewLocation(name) {
        try {
            const response = await fetch(`${API_URL}/locations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Ubicación agregada exitosamente');
                fetchLocations();
            } else {
                alert(data.error || 'Error al agregar la ubicación');
                locationSelect.value = '';
            }
        } catch (error) {
            console.error('Error al agregar la ubicación:', error);
            alert('Error al agregar la ubicación');
            locationSelect.value = '';
        }
    }

    // Inicializar Select2 en todas las selectores con la clase 'select2'
    function initializeSelect2() {
        $('.select2').select2({
            placeholder: 'Selecciona una opción',
            allowClear: true
        });
    }

    // Agregar un nuevo producto
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const category = e.target.category.value.trim();
        const quantity = parseInt(e.target.quantity.value);
        const location = e.target.location.value.trim();

        if (!name || isNaN(quantity)) {
            alert('Por favor, completa todos los campos requeridos correctamente.');
            return;
        }

        console.log(`Agregando Producto: ${name}, Categoría: ${category}, Cantidad: ${quantity}, Ubicación: ${location}`);

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, category, quantity, location }),
            });

            const data = await response.json();
            console.log('Respuesta del servidor (agregar producto):', data);

            if (response.ok) {
                alert('Producto agregado exitosamente');
                addProductForm.reset();
                fetchCategories(); // Actualizar categorías en caso de nuevas
                fetchLocations();  // Actualizar ubicaciones en caso de nuevas
                fetchProducts();
            } else {
                alert(data.error || 'Error al agregar el producto');
            }
        } catch (error) {
            console.error('Error en la solicitud de agregar producto:', error);
            alert('Error al agregar el producto');
        }
    });

    // Obtener y mostrar los productos
    async function fetchProducts() {
        console.log('Obteniendo productos del servidor...');
        try {
            const response = await fetch(`${API_URL}/products`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const products = await response.json();
            console.log('Productos recibidos:', products);

            if (response.ok) {
                renderProducts(products);
            } else {
                alert('Error al obtener los productos');
            }
        } catch (error) {
            console.error('Error en la solicitud de obtener productos:', error);
            alert('Error al obtener los productos');
        }
    }

    // Renderizar los productos en la tabla
    function renderProducts(products) {
        productsTableBody.innerHTML = '';
        products.forEach(product => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category || '-'}</td>
                <td>${product.quantity}</td>
                <td>${product.location || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-warning me-2 edit-btn" data-id="${product.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${product.id}">Eliminar</button>
                </td>
            `;

            productsTableBody.appendChild(row);
        });

        // Inicializar DataTables
        $('#productsTable').DataTable({
            destroy: true, // Permite reinicializar DataTables
            paging: true,
            searching: true,
            ordering: true,
            order: [[0, 'asc']], // Ordenar por ID ascendente por defecto
        });

        // Asignar eventos a los botones de editar y eliminar
        const editButtons = document.querySelectorAll('.edit-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.getAttribute('data-id');
                editProduct(productId);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.getAttribute('data-id');
                deleteProduct(productId);
            });
        });
    }

    // Función para editar un producto
    async function editProduct(id) {
        try {
            // Obtener los datos actuales del producto
            const response = await fetch(`${API_URL}/products`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const products = await response.json();
            const product = products.find(p => p.id == id);

            if (!product) {
                alert('Producto no encontrado');
                return;
            }

            // Prellenar los campos del modal con los datos del producto
            editProductId.value = product.id;
            editName.value = product.name;
            editCategory.value = product.category || '';
            editQuantity.value = product.quantity;
            editLocation.value = product.location || '';

            // Re-inicializar Select2 para el modal
            initializeSelect2();

            // Mostrar el modal
            editProductModal.show();
        } catch (error) {
            console.error('Error al obtener los productos para editar:', error);
            alert('Error al obtener los datos del producto');
        }
    }

    // Manejar la actualización del producto desde el modal
    editProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editProductId.value;
        const name = editName.value.trim();
        const category = editCategory.value.trim();
        const quantity = parseInt(editQuantity.value);
        const location = editLocation.value.trim();

        if (!name || isNaN(quantity)) {
            alert('Por favor, completa todos los campos requeridos correctamente.');
            return;
        }

        console.log(`Actualizando Producto ID: ${id}, Nombre: ${name}, Categoría: ${category}, Cantidad: ${quantity}, Ubicación: ${location}`);

        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name, category, quantity, location }),
            });

            const data = await response.json();
            console.log('Respuesta del servidor (actualizar producto):', data);

            if (response.ok) {
                alert('Producto actualizado exitosamente');
                editProductForm.reset();
                editProductModal.hide();
                fetchCategories(); // Actualizar categorías en caso de nuevas
                fetchLocations();  // Actualizar ubicaciones en caso de nuevas
                fetchProducts();
            } else {
                alert(data.error || 'Error al actualizar el producto');
            }
        } catch (error) {
            console.error('Error en la solicitud de actualizar producto:', error);
            alert('Error al actualizar el producto');
        }
    });

    // Función para eliminar un producto
    async function deleteProduct(id) {
        if (!confirm('¿Está seguro de que desea eliminar este producto?')) return;

        console.log(`Eliminando Producto ID: ${id}`);

        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            console.log('Respuesta del servidor (eliminar producto):', data);

            if (response.ok) {
                alert('Producto eliminado exitosamente');
                fetchProducts();
            } else {
                alert(data.error || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error en la solicitud de eliminar producto:', error);
            alert('Error al eliminar el producto');
        }
    }

    // Función para filtrar productos según la búsqueda
    function filterProducts() {
        const filter = searchInput.value.toLowerCase();
        const rows = productsTableBody.getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const name = row.cells[1].textContent.toLowerCase();
            const category = row.cells[2].textContent.toLowerCase();
            const location = row.cells[4].textContent.toLowerCase();

            if (name.includes(filter) || category.includes(filter) || location.includes(filter)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // Evento para la búsqueda en tiempo real
    searchInput.addEventListener('input', filterProducts);

    // Manejar la agregación de nueva categoría desde el modal de edición
    editCategory.addEventListener('change', function () {
        if (editCategory.value === 'add_new') {
            const newCategory = prompt('Ingrese el nombre de la nueva categoría:');
            if (newCategory) {
                addNewCategory(newCategory);
            } else {
                // Si el usuario cancela o no ingresa nada, restablecer el select
                editCategory.value = '';
            }
        }
    });

    // Manejar la agregación de nueva ubicación desde el modal de edición
    editLocation.addEventListener('change', function () {
        if (editLocation.value === 'add_new') {
            const newLocation = prompt('Ingrese el nombre de la nueva ubicación:');
            if (newLocation) {
                addNewLocation(newLocation);
            } else {
                // Si el usuario cancela o no ingresa nada, restablecer el select
                editLocation.value = '';
            }
        }
    });

    // Inicializar la interfaz de usuario
    updateUI();
});
