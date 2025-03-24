const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const fetch = require('node-fetch');

let mainWindow;
let captureInterval;
let currentUsername = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 450,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
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

async function captureScreen() {
    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });

        const source = sources[0];
        if (!source) {
            console.error('No screen source found');
            return;
        }

        const thumbnail = source.thumbnail.toDataURL();

        if (!currentUsername) {
            console.error('No username found');
            mainWindow.webContents.send('capture-status', {
                message: 'Error: Not logged in',
                is_on_task: false,
                points_earned: 0,
                total_points: 0
            });
            return;
        }

        const response = await fetch('http://127.0.0.1:5000/upload_screenshot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUsername,
                screenshot: thumbnail
            })
        });

        if (response.ok) {
            const data = await response.json();
            mainWindow.webContents.send('capture-status', data);
        } else {
            const errorText = await response.text();
            console.error('Upload failed:', response.status, errorText);
            mainWindow.webContents.send('capture-status', {
                message: 'Upload failed',
                is_on_task: false,
                points_earned: 0,
                total_points: 0
            });
        }
    } catch (error) {
        console.error('Error capturing screen:', error);
        mainWindow.webContents.send('capture-status', {
            message: 'Error capturing screen',
            is_on_task: false,
            points_earned: 0,
            total_points: 0
        });
    }
}

ipcMain.on('start-capture', (event, data) => {
    currentUsername = data.username;
    captureScreen(); // Capture immediately
    captureInterval = setInterval(captureScreen, 20000); // Then every 20 seconds
    mainWindow.webContents.send('capture-status', {
        message: 'Starting capture...',
        is_on_task: false,
        points_earned: 0,
        total_points: 0
    });
});

ipcMain.on('stop-capture', () => {
    currentUsername = null;
    if (captureInterval) {
        clearInterval(captureInterval);
        captureInterval = null;
    }
    mainWindow.webContents.send('capture-status', {
        message: 'Capture stopped',
        is_on_task: false,
        points_earned: 0,
        total_points: 0
    });
}); 