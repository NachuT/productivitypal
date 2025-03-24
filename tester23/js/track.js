const FLASK_SERVER_URL = 'http://127.0.0.1:5000';

// Get username from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username') || localStorage.getItem('username') || 'anonymous';  // Default to 'anonymous' like Python example

// Check authentication
if (!username) {
    window.location.href = 'index.html';
}

// Store username in localStorage as backup
localStorage.setItem('username', username);

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${FLASK_SERVER_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
});

const startBtn = document.getElementById('start-capture');
const stopBtn = document.getElementById('stop-capture');
const statusText = document.getElementById('status-text');
let captureInterval;

startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = 'Capturing...';

    // Start capturing screenshots
    captureInterval = setInterval(() => {
        // Capture the screen using Electron's built-in function
        const { desktopCapturer } = require('electron');
        
        desktopCapturer.getSources({ 
            types: ['screen'], 
            thumbnailSize: { width: 1920, height: 1080 } 
        }).then(async sources => {
            const screenshot = sources[0].thumbnail.toDataURL();
            
            try {
                const response = await fetch(`${FLASK_SERVER_URL}/upload_screenshot`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: 'n',  // Fixed username as 'n' like in Python example
                        screenshot: screenshot.split(',')[1]  // Remove the data:image/png;base64 prefix
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to upload screenshot');
                }

                console.log("Screenshot uploaded successfully!");
                statusText.textContent = data.is_on_task ? 'On task ✅' : 'Off task ❌';
            } catch (error) {
                console.error('Upload error:', error);
                statusText.textContent = 'Upload error';
            }
        }).catch(error => {
            console.error('Capture error:', error);
            statusText.textContent = 'Capture error';
        });
    }, 20000); // Capture every 20 seconds like Python example
});

stopBtn.addEventListener('click', () => {
    clearInterval(captureInterval);
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent = 'Ready';
}); 