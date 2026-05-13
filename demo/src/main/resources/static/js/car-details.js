document.addEventListener('DOMContentLoaded', () => {
    initPage();
});

let currentCar = null;

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatYMD(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(s) {
    const [y, m, da] = s.split('-').map(Number);
    return new Date(y, m - 1, da);
}

function addDaysStr(ymd, days) {
    const d = parseYMD(ymd);
    d.setDate(d.getDate() + days);
    return formatYMD(d);
}

async function initPage() {
    const params = new URLSearchParams(window.location.search);
    const carId = Number(params.get('id'));
    let car = null;

    try {
        if (carId) {
            car = await fetchVehicleById(carId);
        }
    } catch (error) {
        console.error('Could not load vehicle details by ID:', error);
    }

    if (!car) {
        try {
            const allCars = await fetchVehicles();
            car = allCars[0] || null;
        } catch (error) {
            console.error('Could not load fallback vehicle list:', error);
        }
    }

    if (!car) {
        return;
    }

    populateDetails(car);
    wireReserveDates(car);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function wireReserveDates(car) {
    const pickup = document.getElementById('carPickupDate');
    const ret = document.getElementById('carReturnDate');
    const city = document.getElementById('carPickupCity');
    if (!pickup || !ret) return;

    const todayStr = formatYMD(new Date());
    pickup.min = todayStr;
    ret.min = addDaysStr(todayStr, 1);

    const qp = new URLSearchParams(window.location.search);
    if (qp.get('pickup')) pickup.value = qp.get('pickup');
    if (qp.get('return')) ret.value = qp.get('return');
    if (!pickup.value) pickup.value = addDaysStr(todayStr, 1);
    if (!ret.value) ret.value = addDaysStr(todayStr, 8);

    const syncRetMin = () => {
        if (!pickup.value) return;
        const minR = addDaysStr(pickup.value, 1);
        ret.min = minR;
        if (ret.value && ret.value <= pickup.value) ret.value = minR;
    };

    pickup.addEventListener('change', () => {
        syncRetMin();
        updateReserveHref(car);
    });
    ret.addEventListener('change', () => updateReserveHref(car));
    if (city) city.addEventListener('change', () => updateReserveHref(car));
    syncRetMin();
    updateReserveHref(car);
}

function updateReserveHref(car) {
    const btn = document.getElementById('reserveCarBtn');
    if (!btn) return;

    let session = null;
    try {
        const raw = localStorage.getItem('driveRedUserSession');
        session = raw ? JSON.parse(raw) : null;
    } catch (e) {
        session = null;
    }

    if (!session || !session.id) {
        btn.classList.remove('is-disabled');
        const next = encodeURIComponent(window.location.href);
        btn.href = `login.html?next=${next}`;
        btn.removeAttribute('aria-disabled');
        btn.title = 'Sign in to reserve this vehicle';
        return;
    }

    btn.title = '';

    if (!car.bookable) {
        btn.classList.add('is-disabled');
        btn.href = '#';
        btn.setAttribute('aria-disabled', 'true');
        return;
    }

    btn.classList.remove('is-disabled');
    btn.setAttribute('aria-disabled', 'false');
    const pickup = document.getElementById('carPickupDate')?.value || '';
    const ret = document.getElementById('carReturnDate')?.value || '';
    const city = document.getElementById('carPickupCity')?.value || 'Cairo';
    const q = new URLSearchParams({ id: String(car.id), pickup, return: ret, city });
    btn.href = `checkout.html?${q.toString()}`;
}

function populateDetails(car) {
    currentCar = car;
    document.getElementById('carName').textContent = car.name;
    document.getElementById('carTypeBadge').textContent = car.type;
    document.getElementById('carTagline').textContent = `${car.city} • ${car.modelYear} • Rated ${car.rating}/5`;
    document.getElementById('carDescription').textContent = car.description;
    document.getElementById('carPrice').textContent = `$${car.price} / day`;
    document.getElementById('heroImage').src = car.img;
    document.getElementById('heroImage').alt = car.name;

    const banner = document.getElementById('carAvailabilityBanner');
    if (banner) {
        if (!car.bookable) {
            banner.classList.remove('hidden');
            const st = (car.availabilityStatus || '').toLowerCase();
            banner.textContent =
                st === 'maintenance'
                    ? 'This vehicle is in maintenance. You can view details, but online booking is disabled.'
                    : 'This vehicle is currently reserved. You can view details, but it cannot be booked until it is available again.';
        } else {
            banner.classList.add('hidden');
        }
    }

    updateReserveHref(car);

    const specGrid = document.getElementById('specGrid');
    const specs = [
        { label: 'Category', value: car.category.toUpperCase() },
        { label: 'Model year', value: `${car.modelYear}` },
        { label: 'Seats', value: `${car.seats} seats` },
        { label: 'Transmission', value: car.transmission },
        { label: 'Fuel', value: car.fuel },
        { label: 'Engine', value: car.engine },
        { label: 'Drive', value: car.drive || 'FWD' },
        { label: 'Luggage', value: car.luggage }
    ];

    specGrid.innerHTML = specs
        .map((spec) => `<div class="spec-item"><p>${spec.label}</p><p>${spec.value}</p></div>`)
        .join('');

    const egyptReasons = document.getElementById('egyptReasons');
    egyptReasons.innerHTML = `
        <p><strong>Built for local roads:</strong> This ${car.type.toLowerCase()} balances comfort with performance for daily city traffic and highway trips.</p>
        <p><strong>Smart for Egyptian weather:</strong> Strong A/C performance and stable ride quality for hot summer days and long-distance travel.</p>
        <p><strong>Practical rental value:</strong> A category that fits both personal and business needs.</p>
    `;
}
