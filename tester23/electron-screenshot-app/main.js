const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

let screenshotInterval;

async function captureScreen() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });
        
        if (sources.length > 0) {
            const source = sources[0];
            const thumbnail = source.thumbnail.toDataURL();
            const base64Image = thumbnail.split(',')[1];
            
            try {
                const response = await axios.post('http://127.0.0.1:5000/upload_screenshot', {
                    screenshot: base64Image
                });
                
                if (response.status === 200) {
                    mainWindow.webContents.send('capture-status', 'Screenshot uploaded successfully');
                }
            } catch (error) {
                mainWindow.webContents.send('capture-status', `Error uploading: ${error.message}`);
            }
        }
    } catch (error) {
        mainWindow.webContents.send('capture-status', `Error capturing: ${error.message}`);
    }
}

ipcMain.on('start-capture', () => {
    screenshotInterval = setInterval(captureScreen, 20000); // 20 seconds interval
    captureScreen(); // Take first screenshot immediately
});

ipcMain.on('stop-capture', () => {
    if (screenshotInterval) {
        clearInterval(screenshotInterval);
        mainWindow.webContents.send('capture-status', 'Screenshot capture stopped');
    }
}); 