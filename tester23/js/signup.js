const FLASK_SERVER_URL = 'http://127.0.0.1:5000';

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch(`${FLASK_SERVER_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Signup successful! Please login.');
            window.location.href = 'index.html';
        } else {
            errorMessage.textContent = data.error || 'Signup failed';
        }
    } catch (error) {
        console.error('Signup error:', error);
        errorMessage.textContent = 'Failed to connect to server';
    }
}); 