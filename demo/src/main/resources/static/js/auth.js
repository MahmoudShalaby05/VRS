const ADMIN_CREDENTIALS = {
    email: 'admin@drivered.com',
    password: 'Admin1234!',
    name: 'Administrator'
};
const ADMIN_DASHBOARD_PATH = 'admin/Admin.html';
const AUTH_API_BASE = '/api/auth';

function setFormStatus(elementId, message, isSuccess) {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('hidden', 'bg-red-500/10', 'text-red-200', 'bg-emerald-500/10', 'text-emerald-200');
    statusEl.classList.add(isSuccess ? 'bg-emerald-500/10' : 'bg-red-500/10');
    statusEl.classList.add(isSuccess ? 'text-emerald-200' : 'text-red-200');
}

function togglePasswordVisibility(buttonId, inputId) {
    const toggleButton = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    if (!toggleButton || !input) return;

    toggleButton.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        toggleButton.textContent = isPassword ? 'Hide' : 'Show';
    });
}

function getStoredUsers() {
    try {
        const stored = localStorage.getItem('driveRedUsers');
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.error('Unable to read stored users:', error);
        return {};
    }
}

function saveStoredUsers(users) {
    localStorage.setItem('driveRedUsers', JSON.stringify(users));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;
    
    return hasUpperCase && hasLowerCase && hasNumber && hasSymbol && hasMinLength;
}

function getPasswordErrors(password) {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('1 uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('1 lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('1 number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('1 special character');
    return errors;
}

function validatePhone(phone) {
    return /^01\d{8,9}$/.test(phone.replace(/\s/g, ''));
}

function isAdminUser(email, password) {
    return email.toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
}

function setAdminAuth() {
    localStorage.setItem('driveRedAdminAuth', 'true');
}

function clearAdminAuth() {
    localStorage.removeItem('driveRedAdminAuth');
}

function isAdminAuthenticated() {
    return localStorage.getItem('driveRedAdminAuth') === 'true';
}

async function registerUserApi(payload) {
    const response = await fetch(`${AUTH_API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Register failed (${response.status})`);
    }

    return response.json();
}

async function loginUserApi(payload) {
    const response = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Login failed (${response.status})`);
    }

    return response.json();
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const statusId = 'loginStatus';

    if (!email || !password) {
        setFormStatus(statusId, 'Please enter your email and password.', false);
        return;
    }
    if (!validateEmail(email)) {
        setFormStatus(statusId, 'Please enter a valid email address.', false);
        return;
    }
    if (password.length < 8) {
        setFormStatus(statusId, 'Password must be at least 8 characters.', false);
        return;
    }

    if (isAdminUser(email, password)) {
        setAdminAuth();
        setFormStatus(statusId, 'Admin credentials verified. Redirecting...', true);
        setTimeout(() => {
            window.location.href = ADMIN_DASHBOARD_PATH;
        }, 1200);
        return;
    }

    try {
        const user = await loginUserApi({ email, password });
        localStorage.setItem('driveRedUserSession', JSON.stringify(user));
        setFormStatus(statusId, `Welcome back, ${user.name.split(' ')[0]}! Redirecting...`, true);
        setTimeout(() => {
            let redirectTo = 'index.html';
            const raw = new URLSearchParams(window.location.search).get('next');
            if (raw) {
                try {
                    const u = new URL(raw, window.location.origin);
                    if (u.origin === window.location.origin) {
                        redirectTo = u.pathname + u.search + u.hash;
                    }
                } catch (e) {
                    redirectTo = 'index.html';
                }
            }
            window.location.href = redirectTo;
        }, 1200);
    } catch (error) {
        console.error('Login failed:', error);
        setFormStatus(statusId, 'Incorrect email or password.', false);
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;
    const termsAccepted = document.getElementById('acceptTerms').checked;
    const statusId = 'registerStatus';

    if (!name || !email || !phone || !password || !confirmPassword) {
        setFormStatus(statusId, 'Please fill in all required fields.', false);
        return;
    }
    if (!validateEmail(email)) {
        setFormStatus(statusId, 'Please enter a valid email address.', false);
        return;
    }
    if (!validatePhone(phone)) {
        setFormStatus(statusId, 'Please enter a valid phone number.', false);
        return;
    }
    if (!validatePassword(password)) {
        const errors = getPasswordErrors(password);
        setFormStatus(statusId, `Password needs: ${errors.join(', ')}.`, false);
        return;
    }
    if (password !== confirmPassword) {
        setFormStatus(statusId, 'Passwords do not match.', false);
        return;
    }
    if (!termsAccepted) {
        setFormStatus(statusId, 'You must accept the terms to continue.', false);
        return;
    }

    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail === ADMIN_CREDENTIALS.email) {
        setFormStatus(statusId, 'That email is reserved for admin access.', false);
        return;
    }

    try {
        await registerUserApi({
            name,
            email: normalizedEmail,
            phone,
            password
        });

        setFormStatus(statusId, 'Account created successfully. Redirecting to login...', true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    } catch (error) {
        console.error('Registration failed:', error);
        const message = String(error.message || '').toLowerCase();
        if (message.includes('conflict') || message.includes('already exists')) {
            setFormStatus(statusId, 'A user with that email already exists.', false);
            return;
        }
        setFormStatus(statusId, 'Could not create account. Please try again.', false);
    }
}

function handleAdminSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const statusId = 'adminStatus';

    if (!email || !password) {
        setFormStatus(statusId, 'Please enter your email and password.', false);
        return;
    }
    if (!validateEmail(email)) {
        setFormStatus(statusId, 'Please enter a valid email address.', false);
        return;
    }
    if (password.length < 8) {
        setFormStatus(statusId, 'Password must be at least 8 characters.', false);
        return;
    }
    if (!isAdminUser(email, password)) {
        setFormStatus(statusId, 'Incorrect admin credentials.', false);
        return;
    }

    setAdminAuth();
    setFormStatus(statusId, 'Admin access granted. Redirecting...', true);
    setTimeout(() => {
        window.location.href = ADMIN_DASHBOARD_PATH;
    }, 1200);
}

function verifyAdminPanelAccess() {
    const path = window.location.pathname.toLowerCase();
    const isAdminDashboard = path.includes('/admin/admin.html');
    if (isAdminDashboard && !isAdminAuthenticated()) {
        window.location.href = 'admin.html';
    }
}

function logoutAdmin() {
    clearAdminAuth();
    window.location.href = 'admin.html';
}

function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const adminForm = document.getElementById('adminForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
        togglePasswordVisibility('toggleLoginPassword', 'loginPassword');
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
        togglePasswordVisibility('toggleRegisterPassword', 'registerPassword');
    }
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminSubmit);
        togglePasswordVisibility('toggleAdminPassword', 'adminPassword');
    }

    const adminPanel = document.querySelector('body.admin-panel');
    if (adminPanel) {
        verifyAdminPanelAccess();
    }

    initAdminShortcut();
}

function initAdminShortcut() {
    window.addEventListener('keydown', (event) => {
        const isAdminShortcut = event.ctrlKey && event.shiftKey && (
            event.code === 'Digit5' ||
            event.key === '5' ||
            event.key === '%'
        );

        if (isAdminShortcut) {
            const path = window.location.pathname.toLowerCase();
            const onAdminLogin = path.endsWith('/admin.html');
            const onAdminDashboard = path.includes('/admin/admin.html');
            if (!onAdminLogin && !onAdminDashboard) {
                window.location.href = 'admin.html';
            }
        }
    });
}

window.addEventListener('DOMContentLoaded', initAuthForms);
