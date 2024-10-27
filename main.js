const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

// Iniciar el servidor Express como un proceso separado
let serverProcess;

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Ruta al archivo preload.js
            nodeIntegration: false, // Deshabilitar nodeIntegration por seguridad
            contextIsolation: true, // Habilitar contextIsolation por seguridad
        }
    });

    win.loadFile('index.html');

    // Abrir las herramientas de desarrollo
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    // Iniciar el backend
    serverProcess = fork(path.join(__dirname, 'server', 'server.js'), {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Redirigir stdout y stderr del servidor al proceso principal
    serverProcess.stdout.on('data', (data) => {
        console.log(`Servidor: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`Servidor ERROR: ${data}`);
    });

    serverProcess.on('close', (code) => {
        console.log(`Servidor Express finalizado con el código ${code}`);
    });

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
    if (serverProcess) serverProcess.kill();
});
