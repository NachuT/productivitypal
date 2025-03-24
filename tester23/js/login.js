const FLASK_SERVER_URL = 'http://127.0.0.1:5000';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch(`${FLASK_SERVER_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'  // Important for session cookies
        });

        const data = await response.json();
        
        if (response.ok) {
            // Store username and redirect with username parameter
            localStorage.setItem('username', username);
            window.location.href = `track.html?username=${encodeURIComponent(username)}`;
        } else {
            errorMessage.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'Failed to connect to server';
    }
}); 