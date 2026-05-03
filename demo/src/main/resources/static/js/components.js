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

// === Load components when DOM is ready ===
document.addEventListener('DOMContentLoaded', async () => {
    await initComponents();
});