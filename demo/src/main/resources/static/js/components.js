// === Component Loader Functions ===
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error(`Failed to load ${componentPath}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${componentPath}:`, error);
    }
}

// === Load Navbar ===
async function loadNavbar() {
    await loadComponent('navbar-container', 'components/navbar.html');
    personalizeNavbarAuth();
    initNavbarScroll();
}

// === Load Footer ===
async function loadFooter() {
    await loadComponent('footer-container', 'components/footer.html');
}

// === Initialize All Components ===
async function initComponents() {
    await loadNavbar();
    await loadFooter();
    
    // Reinitialize Lucide icons after components are loaded
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Dispatch event when components are ready
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
}

// === Navbar Scroll Effect ===
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// === Mobile Menu Functions ===
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

function getSessionUser() {
    try {
        const raw = localStorage.getItem('driveRedUserSession');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Invalid user session data:', error);
        return null;
    }
}

function clearUserSession() {
    localStorage.removeItem('driveRedUserSession');
}

function personalizeNavbarAuth() {
    const user = getSessionUser();
    const desktopAuthArea = document.getElementById('desktopAuthArea');
    const mobileAuthArea = document.getElementById('mobileAuthArea');
    if (!desktopAuthArea || !mobileAuthArea) return;

    if (!user) return;

    const avatarSrc = user.profileImageUrl
        || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'drivered-user')}`;

    desktopAuthArea.innerHTML = `
        <a href="/profile.html" class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-white font-semibold hover:bg-white/15 transition">
            <img src="${avatarSrc}" alt="Profile" class="w-8 h-8 rounded-full object-cover border border-white/30">
            <span class="hidden lg:inline">${(user.name || 'Profile').split(' ')[0]}</span>
        </a>
        <button id="logoutBtnDesktop" class="rounded-full bg-darkRed hover:bg-red-800 px-4 py-2 text-white font-semibold transition">Logout</button>
    `;

    mobileAuthArea.innerHTML = `
        <a href="/profile.html" class="block w-full bg-darkRed text-white py-3 rounded-full font-semibold text-center" onclick="closeMobileMenu()">My Profile</a>
        <button id="logoutBtnMobile" class="block w-full border border-darkRed text-darkRed py-3 rounded-full font-semibold text-center mt-3">Logout</button>
    `;

    document.getElementById('logoutBtnDesktop')?.addEventListener('click', () => {
        clearUserSession();
        window.location.href = '/login.html';
    });
    document.getElementById('logoutBtnMobile')?.addEventListener('click', () => {
        clearUserSession();
        window.location.href = '/login.html';
    });
}

// === Load components when DOM is ready ===
document.addEventListener('DOMContentLoaded', async () => {
    await initComponents();
});