const FLASK_SERVER_URL = 'http://127.0.0.1:5000';

// Check authentication
if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// Load screenshots
async function loadScreenshots() {
    try {
        const response = await fetch(`${FLASK_SERVER_URL}/feed`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch feed');
        }

        const data = await response.json();
        const grid = document.getElementById('screenshots-grid');
        grid.innerHTML = '';

        data.screenshots.forEach(screenshot => {
            const card = document.createElement('div');
            card.className = 'screenshot-card';
            
            const img = document.createElement('img');
            img.src = screenshot.url || screenshot.image;  // Handle both possible response formats
            img.alt = 'Screenshot';
            
            const timestamp = document.createElement('p');
            timestamp.textContent = new Date(screenshot.timestamp).toLocaleString();
            
            card.appendChild(img);
            card.appendChild(timestamp);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading feed:', error);
        alert('Failed to load feed');
    }
}

// Load screenshots on page load
loadScreenshots();

// Refresh feed every 30 seconds
setInterval(loadScreenshots, 30000); 