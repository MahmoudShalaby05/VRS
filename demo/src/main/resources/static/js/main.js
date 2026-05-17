// === Main Application Logic ===
document.addEventListener('DOMContentLoaded', async () => {
    await initBrandStrip();

    // Wait for components to be loaded before initializing
    const initApp = () => {
        initRevealAnimations();
        initDateInputs();
        lucide.createIcons();
    };
    
    // Check if components are already loaded
    if (document.getElementById('navbar')) {
        initApp();
    } else {
        document.addEventListener('componentsLoaded', initApp);
    }
});

async function initBrandStrip() {
    const brandStrip = document.getElementById('brandStrip');
    if (!brandStrip) return;

    brandStrip.innerHTML = '<div class="brand-pill">Loading brands...</div>';

    try {
        const vehicles = await fetchVehicles();
        const brands = [...new Set(vehicles.map((vehicle) => vehicle.brand).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b));

        if (brands.length === 0) {
            brandStrip.innerHTML = '<div class="brand-pill">No brands available</div>';
            return;
        }

        const pills = brands
            .map(
                (brand) => `
                    <button type="button" class="brand-pill" onclick="navigateToVehiclesByBrand('${brand}')" role="listitem">
                        ${brand}
                    </button>
                `
            )
            .join('');

        brandStrip.innerHTML = `
            <div class="brand-strip-track" aria-hidden="true">
                ${pills}${pills}
            </div>
        `;
    } catch (error) {
        console.error('Failed to load brand strip:', error);
        brandStrip.innerHTML = '<div class="brand-pill">Unable to load brands</div>';
    }
}

// === Modal Functions ===
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
    }
}

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[id$="Modal"]');
        modals.forEach(modal => {
            if (!modal.classList.contains('hidden')) {
                closeModal(modal.id);
            }
        });
    }
});

// === Toast Notification ===
function showToast(message, duration = 4000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('translate-y-20', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');

        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
            toast.classList.remove('translate-y-0', 'opacity-100');
        }, duration);
    }
}

// === Contact Form Handler ===
function handleContact(event) {
    event.preventDefault();
    event.target.reset();
    showToast('✅ Message sent successfully! We\'ll get back to you soon.');
}

// === Signup Form Handler ===
function handleSignup(event) {
    event.preventDefault();
    closeModal('signupModal');
    showToast('🎉 Account created successfully! Welcome to DriveRed.');
}

// === Navigation Functions ===
function navigateToVehicles() {
    window.location.href = 'vehicles.html';
}

function navigateToVehiclesByBrand(brand) {
    const encodedBrand = encodeURIComponent(String(brand).trim().toLowerCase());
    window.location.href = `vehicles.html?brand=${encodedBrand}`;
}

function navigateToContact() {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = 'index.html#contact';
    }
}

// === Reveal Animations ===
function initRevealAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
}

// === Date Inputs ===
function initDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.min = today;
    });
}

// === Smooth Scroll for Anchor Links ===
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (anchor) {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile menu if open
            closeMobileMenu();
        }
    }
});