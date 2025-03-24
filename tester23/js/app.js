const { ipcRenderer } = require('electron');

// Configuration
const FLASK_SERVER_URL = 'http://localhost:5000';

class App {
    constructor() {
        this.initializeElements();
        this.addEventListeners();
    }

    initializeElements() {
        // Auth elements
        this.authContainer = document.getElementById('auth-container');
        this.mainContainer = document.getElementById('main-container');
        this.loginSection = document.getElementById('login-section');
        this.signupSection = document.getElementById('signup-section');
        this.loginForm = document.getElementById('loginForm');
        this.signupForm = document.getElementById('signupForm');
        this.showSignupLink = document.getElementById('show-signup');
        this.showLoginLink = document.getElementById('show-login');

        // Main interface elements
        this.feedSection = document.getElementById('feed-section');
        this.captureSection = document.getElementById('capture-section');
        this.postsContainer = document.getElementById('posts-container');
        this.captureStatus = document.getElementById('capture-status');
        this.startCaptureBtn = document.getElementById('startCapture');
        this.stopCaptureBtn = document.getElementById('stopCapture');
        this.navButtons = document.querySelectorAll('.nav-button');

        // State
        this.isCapturing = false;
        this.captureInterval = null;
    }

    addEventListeners() {
        // Auth section toggle
        this.showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Show signup clicked');
            this.loginSection.style.display = 'none';
            this.signupSection.style.display = 'block';
        });

        this.showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Show login clicked');
            this.signupSection.style.display = 'none';
            this.loginSection.style.display = 'block';
        });

        // Auth form submissions
        this.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                await this.callApi('/login', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });

                this.authContainer.style.display = 'none';
                this.mainContainer.style.display = 'block';
                await this.loadPosts();
                this.showMessage('Successfully logged in!');
            } catch (error) {
                console.error('Login error:', error);
            }
        });

        this.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;

            try {
                await this.callApi('/signup', {
                    method: 'POST',
                    body: JSON.stringify({ username, password })
                });

                this.signupSection.style.display = 'none';
                this.loginSection.style.display = 'block';
                this.showMessage('Account created successfully! Please log in.');
            } catch (error) {
                console.error('Signup error:', error);
            }
        });

        // Navigation
        this.navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const section = button.dataset.section;
                this.navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                document.querySelectorAll('.main-section').forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(`${section}-section`).classList.add('active');
            });
        });

        // Screenshot capture
        this.startCaptureBtn.addEventListener('click', async () => {
            this.isCapturing = true;
            this.startCaptureBtn.style.display = 'none';
            this.stopCaptureBtn.style.display = 'block';
            this.captureStatus.textContent = 'Capturing screenshots...';
            this.captureStatus.classList.add('capturing');
            
            this.captureInterval = setInterval(async () => {
                try {
                    const screenshot = await window.electron.captureScreenshot();
                    const result = await this.callApi('/upload_screenshot', {
                        method: 'POST',
                        body: JSON.stringify({ screenshot })
                    });

                    if (result.is_on_task) {
                        this.showMessage('On task! Keep going!');
                    } else {
                        this.showMessage('Off task! Focus on your work!', 'error');
                    }
                } catch (error) {
                    console.error('Screenshot error:', error);
                    this.showMessage('Failed to capture screenshot', 'error');
                }
            }, 30000); // Capture every 30 seconds
        });

        this.stopCaptureBtn.addEventListener('click', () => {
            this.isCapturing = false;
            clearInterval(this.captureInterval);
            this.startCaptureBtn.style.display = 'block';
            this.stopCaptureBtn.style.display = 'none';
            this.captureStatus.textContent = 'Ready to start capturing';
            this.captureStatus.classList.remove('capturing');
        });
    }

    showMessage(text, type = 'success') {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    async loadPosts() {
        try {
            const data = await this.callApi('/feed');
            this.renderPosts(data.posts);
        } catch (error) {
            console.error('Load posts error:', error);
            this.showMessage('Failed to load posts', 'error');
        }
    }

    renderPosts(posts) {
        if (!this.postsContainer) return;
        
        this.postsContainer.innerHTML = '';
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            postElement.innerHTML = `
                <img src="${FLASK_SERVER_URL}/${post.image_path}" alt="Screenshot" class="post-image">
                <div class="post-content">
                    <p class="post-text">${post.extracted_text}</p>
                    <div class="post-actions">
                        <button class="post-button like" data-id="${post.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            ${post.likes}
                        </button>
                        <button class="post-button dislike" data-id="${post.id}">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            ${post.dislikes}
                        </button>
                    </div>
                </div>
            `;
            this.postsContainer.appendChild(postElement);
        });
    }

    async callApi(endpoint, options = {}) {
        try {
            const response = await fetch(`${FLASK_SERVER_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include' // Important for session cookies
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'An error occurred');
            }
            
            return data;
        } catch (error) {
            this.showMessage(error.message, 'error');
            throw error;
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 