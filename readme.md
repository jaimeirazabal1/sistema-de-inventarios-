# Sistema de Inventarios

![InventoryApp Logo](https://github.com/jaimeirazabal1/sistema-de-inventarios-/raw/main/logo.png)

**Sistema de Inventarios** es una aplicación de escritorio desarrollada con Electron que permite gestionar inventarios de manera eficiente. La aplicación cuenta con una interfaz intuitiva, autenticación de usuarios, y funcionalidades completas de CRUD (Crear, Leer, Actualizar, Eliminar) para productos, categorías y ubicaciones. Además, incorpora tecnologías modernas como Bootstrap, jQuery, DataTables y Select2 para ofrecer una experiencia de usuario fluida y responsiva.

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Instalación](#instalación)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API](#api)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)
- [Contacto](#contacto)

## Características

- **Autenticación de Usuarios:** Registro e inicio de sesión seguro utilizando JWT (JSON Web Tokens).
- **Gestión de Productos:** Añadir, editar, eliminar y listar productos con detalles como nombre, categoría, cantidad y ubicación.
- **Gestión de Categorías y Ubicaciones:** Crear y administrar categorías y ubicaciones para una mejor organización del inventario.
- **Interfaz Intuitiva:** Diseño responsivo y amigable gracias a Bootstrap.
- **Buscador en Tiempo Real:** Filtrado dinámico de productos por nombre, categoría o ubicación.
- **Actualización en Tiempo Real:** La lista de productos se actualiza automáticamente después de cualquier operación CRUD.
- **Soporte Sin Conexión a Internet:** Todas las librerías necesarias están alojadas localmente, permitiendo el funcionamiento de la aplicación sin necesidad de conexión a Internet.
- **Modales para Mejor UX:** Uso de modales de Bootstrap en lugar de `prompt()` para una mejor experiencia de usuario.

## Tecnologías Utilizadas

- **Frontend:**
  - [Electron](https://www.electronjs.org/) - Framework para aplicaciones de escritorio.
  - [Bootstrap 5](https://getbootstrap.com/) - Framework CSS para diseño responsivo.
  - [jQuery](https://jquery.com/) - Biblioteca JavaScript para manipulación del DOM.
  - [DataTables](https://datatables.net/) - Plugin de jQuery para tablas interactivas.
  - [Select2](https://select2.org/) - Plugin de jQuery para selectores mejorados.

- **Backend:**
  - [Express.js](https://expressjs.com/) - Framework web para Node.js.
  - [SQLite](https://www.sqlite.org/index.html) - Base de datos ligera.
  - [Sequelize](https://sequelize.org/) - ORM para Node.js y bases de datos SQL.
  - [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - Implementación de JWT para autenticación.
  - [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - Librería para hashing de contraseñas.

## Instalación

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v14 o superior)
- [npm](https://www.npmjs.com/) (v6 o superior)

### Clonar el Repositorio

```bash
git clone https://github.com/jaimeirazabal1/sistema-de-inventarios-.git
cd sistema-de-inventarios-
```



### Configurar la Base de Datos

El proyecto utiliza SQLite como base de datos. La base de datos se creará automáticamente al iniciar el servidor si no existe.

### Ejecutar el Servidor

En la carpeta `server`, ejecuta:

```bash
node server.js
```

El servidor estará corriendo en [http://localhost:3000](http://localhost:3000).

### Ejecutar la Aplicación Electron

En la carpeta raíz del proyecto, ejecuta:

```bash
npm start
```

Esto abrirá la aplicación de escritorio **Sistema de Inventarios**.

## Uso

1. **Registro de Usuario:**
   - Al iniciar la aplicación por primera vez, puedes registrarte creando una nueva cuenta.
   
2. **Inicio de Sesión:**
   - Ingresa con tus credenciales para acceder al sistema de inventarios.

3. **Agregar Categorías y Ubicaciones:**
   - Desde la sección de administración, puedes agregar nuevas categorías y ubicaciones utilizando los modales correspondientes.

4. **Gestión de Productos:**
   - Añade nuevos productos especificando nombre, categoría, cantidad y ubicación.
   - Edita o elimina productos existentes desde la lista de productos.

5. **Buscar Productos:**
   - Utiliza la barra de búsqueda para filtrar productos por nombre, categoría o ubicación en tiempo real.
 

## API

### Endpoints de Autenticación

- **Registrar Usuario**

  - **URL:** `/api/register`
  - **Método:** `POST`
  - **Body:**
    ```json
    {
      "username": "usuario",
      "password": "contraseña"
    }
    ```
  - **Respuesta:**
    ```json
    {
      "message": "Usuario registrado exitosamente"
    }
    ```

- **Iniciar Sesión**

  - **URL:** `/api/login`
  - **Método:** `POST`
  - **Body:**
    ```json
    {
      "username": "usuario",
      "password": "contraseña"
    }
    ```
  - **Respuesta:**
    ```json
    {
      "token": "jwt_token_aquí"
    }
    ```

### Endpoints de Productos

- **Obtener Productos**

  - **URL:** `/api/products`
  - **Método:** `GET`
  - **Headers:**
    ```
    Authorization: Bearer <token>
    ```
  - **Respuesta:**
    ```json
    [
      {
        "id": 1,
        "name": "Producto 1",
        "category": "Categoría A",
        "quantity": 100,
        "location": "Ubicación X"
      },
      ...
    ]
    ```

- **Agregar Producto**

  - **URL:** `/api/products`
  - **Método:** `POST`
  - **Headers:**
    ```
    Authorization: Bearer <token>
    ```
  - **Body:**
    ```json
    {
      "name": "Nuevo Producto",
      "category": "Categoría B",
      "quantity": 50,
      "location": "Ubicación Y"
    }
    ```
  - **Respuesta:**
    ```json
    {
      "message": "Producto agregado exitosamente"
    }
    ```

- **Actualizar Producto**

  - **URL:** `/api/products/:id`
  - **Método:** `PUT`
  - **Headers:**
    ```
    Authorization: Bearer <token>
    ```
  - **Body:**
    ```json
    {
      "name": "Producto Actualizado",
      "category": "Categoría C",
      "quantity": 75,
      "location": "Ubicación Z"
    }
    ```
  - **Respuesta:**
    ```json
    {
      "message": "Producto actualizado exitosamente"
    }
    ```

- **Eliminar Producto**

  - **URL:** `/api/products/:id`
  - **Método:** `DELETE`
  - **Headers:**
    ```
    Authorization: Bearer <token>
    ```
  - **Respuesta:**
    ```json
    {
      "message": "Producto eliminado exitosamente"
    }
    ```

### Endpoints de Categorías y Ubicaciones

La API para categorías y ubicaciones sigue una estructura similar a la de productos, permitiendo operaciones de CRUD mediante los métodos `GET`, `POST`, `PUT` y `DELETE`.

## Contribuciones

¡Las contribuciones son bienvenidas! Si deseas mejorar este proyecto, sigue estos pasos:

1. **Clonar el Repositorio:**

   ```bash
   git clone https://github.com/jaimeirazabal1/sistema-de-inventarios-.git
   cd sistema-de-inventarios-
   ```

2. **Crear una Rama de Característica:**

   ```bash
   git checkout -b feature/nueva-caracteristica
   ```

3. **Realizar los Cambios y Confirmarlos:**

   ```bash
   git commit -m "Añadir nueva característica"
   ```

4. **Subir la Rama y Crear un Pull Request:**

   ```bash
   git push origin feature/nueva-caracteristica
   ```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulta el archivo [LICENSE](https://github.com/jaimeirazabal1/sistema-de-inventarios-/blob/main/LICENSE) para más detalles.

## Contacto

**Jaime Irábal**

- [GitHub](https://github.com/jaimeirazabal1)
- Email: jaimeirazabal1@gmail.com

¡Gracias por usar **Sistema de Inventarios**! Si tienes alguna pregunta o sugerencia, no dudes en contactarme.

