// ===========================
// DATA STORE
// ===========================
const store = {
    vehicles: [],
    bookings: [],
    damages: [],
    users: [
        { id: 'USR-001', firstName: 'John', lastName: 'Carter', email: 'john.carter@autoadmin.com', phone: '+1 (555) 234-5678', role: 'Super Admin', status: 'Active', joined: '2022-03-15', avatar: null },
        { id: 'USR-002', firstName: 'Sarah', lastName: 'Mitchell', email: 'sarah.mitchell@autoadmin.com', phone: '+1 (555) 987-6543', role: 'Admin', status: 'Active', joined: '2022-06-01', avatar: null },
        { id: 'USR-003', firstName: 'Marcus', lastName: 'Johnson', email: 'marcus.j@autoadmin.com', phone: '+1 (555) 456-7890', role: 'Manager', status: 'Active', joined: '2023-01-20', avatar: null },
        { id: 'USR-004', firstName: 'Emily', lastName: 'Chen', email: 'emily.chen@autoadmin.com', phone: '+1 (555) 321-0987', role: 'Staff', status: 'Active', joined: '2023-05-14', avatar: null },
        { id: 'USR-005', firstName: 'David', lastName: 'Torres', email: 'david.torres@autoadmin.com', phone: '+1 (555) 654-3210', role: 'Staff', status: 'Inactive', joined: '2023-08-30', avatar: null },
        { id: 'USR-006', firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@autoadmin.com', phone: '+1 (555) 111-2222', role: 'Manager', status: 'Suspended', joined: '2024-02-10', avatar: null },
    ],
    admin: {
        name: 'John Carter',
        email: 'john.carter@autoadmin.com',
        phone: '+1 (555) 234-5678',
        location: 'New York, NY 10001',
        role: 'Super Administrator',
        joined: 'March 15, 2022',
    },
    deleteContext: null,
};

// ===========================
// ID COUNTERS
// ===========================
let vehicleCounter = 1;
let userCounter = 7;

// ===========================
// VEHICLE API
// ===========================
const VEHICLE_API_URL = '/api/vehicles';
const AUTH_USERS_API_URL = '/api/auth/users';
const BOOKINGS_API_URL = '/api/bookings';
const DAMAGE_API_URL = '/api/damage-reports';

function mapVehicleFromApi(vehicle) {
    const status = vehicle.availabilityStatus || 'Available';
    return {
        id: String(vehicle.id),
        make: vehicle.brand || 'Unknown',
        model: vehicle.name || 'Vehicle',
        year: vehicle.modelYear || new Date().getFullYear(),
        type: vehicle.category || 'Sedan',
        plate: vehicle.plateNumber || '',
        rate: Number(vehicle.pricePerDay || 0),
        status,
        photo: vehicle.imageUrl || null,
        city: vehicle.city || 'Cairo',
        seats: Number(vehicle.seats || 5),
        transmission: vehicle.transmission || 'Auto',
        fuel: vehicle.fuel || 'Petrol',
        engine: vehicle.engine || '',
        description: vehicle.description || `${vehicle.brand || ''} ${vehicle.name || 'Vehicle'}`
    };
}

function mapVehicleToApi(vehicle) {
    return {
        name: vehicle.model,
        brand: vehicle.make,
        category: vehicle.type,
        modelYear: Number(vehicle.year),
        city: vehicle.city || 'Cairo',
        seats: Number(vehicle.seats || 5),
        transmission: vehicle.transmission || 'Auto',
        fuel: vehicle.fuel || 'Petrol',
        engine: vehicle.engine || '',
        luggage: '2 Bags',
        dailyKm: 250,
        rating: 4.6,
        matchScore: 95,
        badge: vehicle.type || 'Popular',
        imageUrl: vehicle.photo || '',
        description: vehicle.description || `${vehicle.make} ${vehicle.model}`,
        pricePerDay: Number(vehicle.rate || 0),
        plateNumber: vehicle.plate || '',
        availabilityStatus: vehicle.status || 'Available'
    };
}

async function loadVehiclesFromDb() {
    const response = await fetch(VEHICLE_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to load vehicles (${response.status})`);
    }
    const data = await response.json();
    store.vehicles = data.map(mapVehicleFromApi);
}

function mapUserFromApi(user) {
    const parts = String(user.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || 'User';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
    const joined = user.createdAt ? String(user.createdAt).split('T')[0] : new Date().toISOString().split('T')[0];

    return {
        numericId: user.id,
        id: `USR-${user.id}`,
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phone || '',
        role: 'Staff',
        status: 'Active',
        joined,
        avatar: null
    };
}

async function loadUsersFromDb() {
    const response = await fetch(AUTH_USERS_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to load users (${response.status})`);
    }
    const data = await response.json();
    store.users = data.map(mapUserFromApi);
}

function mapBookingFromApi(b) {
    return {
        id: b.id,
        customer: b.guestName || '—',
        guestEmail: b.guestEmail,
        userId: b.userId,
        vehicleId: b.vehicleId,
        startDate: b.pickupDate,
        endDate: b.returnDate,
        planType: b.planType || 'DAILY',
        paymentMethod: b.paymentMethod || 'Cash',
        status: b.status,
        amount: Number(b.totalAmount || 0)
    };
}

async function loadBookingsFromDb() {
    const response = await fetch(BOOKINGS_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to load bookings (${response.status})`);
    }
    const data = await response.json();
    store.bookings = data.map(mapBookingFromApi);
}

function mapDamageFromApi(row) {
    return {
        id: row.id,
        userId: row.userId,
        userName: row.userName || '—',
        vehicleId: String(row.vehicleId),
        vehicleLabel: `${row.vehicleBrand || ''} ${row.vehicleName || ''}`.trim() || String(row.vehicleId),
        description: row.description || '',
        severity: row.severity,
        status: row.status,
        date: row.incidentDate,
        cost: row.estimatedCost != null ? Number(row.estimatedCost) : 0,
        photo: row.photo || null
    };
}

async function loadDamagesFromDb() {
    const response = await fetch(DAMAGE_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to load damage reports (${response.status})`);
    }
    const data = await response.json();
    store.damages = data.map(mapDamageFromApi);
}

// ===========================
// NAVIGATION
// ===========================
function navigateTo(page) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`page-${page}`);
    if (target) {
        target.classList.remove('hidden');
        target.style.animation = 'none';
        target.offsetHeight;
        target.style.animation = '';
    }
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-nav="${page}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    closeSidebar();

    if (page === 'dashboard') refreshDashboard();
    if (page === 'vehicles') renderVehicles();
    if (page === 'bookings') renderBookings();
    if (page === 'damages') renderDamages();
    if (page === 'users') renderUsers();
}

// ===========================
// SIDEBAR
// ===========================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (!sidebar.classList.contains('-translate-x-full') && window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// ===========================
// NOTIFICATIONS
// ===========================
function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('hidden');
}

function clearNotifications() {
    const list = document.getElementById('notifList');
    list.innerHTML = '<div class="p-6 text-center text-gray-500 text-sm">No new notifications</div>';
    document.getElementById('notifBadge').classList.add('hidden');
    showToast('Notifications cleared', 'info');
}

document.addEventListener('click', (e) => {
    const panel = document.getElementById('notifPanel');
    if (!panel.classList.contains('hidden') && !e.target.closest('#notifPanel') && !e.target.closest('[onclick="toggleNotifications()"]')) {
        panel.classList.add('hidden');
    }
});

// ===========================
// GLOBAL SEARCH
// ===========================
function handleGlobalSearch(query) {
    query = query.toLowerCase().trim();
    if (!query) return;

    const vehicleMatch = store.vehicles.find(v =>
        v.id.toLowerCase().includes(query) ||
        v.make.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.plate.toLowerCase().includes(query)
    );
    const bookingMatch = store.bookings.find(b =>
        String(b.id).toLowerCase().includes(query) ||
        b.customer.toLowerCase().includes(query)
    );
    const damageMatch = store.damages.find(d =>
        String(d.id).toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
    );
    const userMatch = store.users.find(u =>
        u.id.toLowerCase().includes(query) ||
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
    );

    if (vehicleMatch) {
        navigateTo('vehicles');
        showToast(`Found vehicle: ${vehicleMatch.id}`, 'success');
    } else if (bookingMatch) {
        navigateTo('bookings');
        showToast(`Found booking: ${bookingMatch.id}`, 'success');
    } else if (damageMatch) {
        navigateTo('damages');
        showToast(`Found report: ${damageMatch.id}`, 'success');
    } else if (userMatch) {
        navigateTo('users');
        showToast(`Found user: ${userMatch.firstName} ${userMatch.lastName}`, 'success');
    }
}

// ===========================
// TOAST NOTIFICATIONS
// ===========================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = {
        success: 'border-green-500 bg-green-500/10',
        error: 'border-red-500 bg-red-500/10',
        info: 'border-accent bg-accent/10',
        warning: 'border-yellow-500 bg-yellow-500/10',
    };
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        info: 'info',
        warning: 'alert-circle',
    };

    toast.className = `toast-enter flex items-center gap-3 px-4 py-3 rounded-lg border ${colors[type] || colors.info} backdrop-blur-sm shadow-xl max-w-sm`;
    toast.innerHTML = `
        <i data-lucide="${icons[type] || icons.info}" class="w-4 h-4 flex-shrink-0"></i>
        <span class="text-sm text-white">${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons({ nodes: [toast] });

    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// ===========================
// DASHBOARD
// ===========================
function refreshDashboard() {
    const totalVehicles = store.vehicles.length;
    const activeBookings = store.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length;
    const totalDamages = store.damages.filter(d => d.status !== 'Resolved').length;
    const totalRevenue = store.bookings.filter(b => b.status === 'Completed' || b.status === 'Confirmed').reduce((sum, b) => sum + b.amount, 0);

    document.getElementById('stat-vehicles').textContent = totalVehicles;
    document.getElementById('stat-bookings').textContent = activeBookings;
    document.getElementById('stat-damages').textContent = totalDamages;
    document.getElementById('stat-revenue').textContent = `$${totalRevenue.toLocaleString()}`;

    const recentBody = document.getElementById('dashRecentBookings');
    const recentBookings = [...store.bookings].sort((a, b) => new Date(b.startDate) - new Date(a.startDate)).slice(0, 5);
    recentBody.innerHTML = recentBookings.map(b => {
        const vehicle = store.vehicles.find(v => String(v.id) === String(b.vehicleId));
        const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : b.vehicleId;
        return `
            <tr class="border-b border-dark-500/50">
                <td class="px-5 py-3 text-sm font-mono text-white">${b.id}</td>
                <td class="px-5 py-3 text-sm text-gray-300">${b.customer}</td>
                <td class="px-5 py-3 text-sm text-gray-300">${vehicleLabel}</td>
                <td class="px-5 py-3"><span class="badge-${b.status.toLowerCase().replace(/\s+/g, '-')} text-xs px-2.5 py-1 rounded-full font-medium">${b.status}</span></td>
                <td class="px-5 py-3 text-sm text-white font-medium">$${b.amount}</td>
            </tr>
        `;
    }).join('');

    const statusContainer = document.getElementById('dashVehicleStatus');
    const available = store.vehicles.filter(v => v.status === 'Available').length;
    const booked = store.vehicles.filter(v => v.status === 'Booked').length;
    const maintenance = store.vehicles.filter(v => v.status === 'Maintenance').length;
    const total = store.vehicles.length;

    statusContainer.innerHTML = `
        <div class="space-y-3">
            <div>
                <div class="flex justify-between text-sm mb-1.5">
                    <span class="text-gray-400">Available</span>
                    <span class="text-green-400 font-medium">${available}/${total}</span>
                </div>
                <div class="w-full bg-dark-500 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full transition-all duration-500" style="width: ${total ? (available / total * 100) : 0}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1.5">
                    <span class="text-gray-400">Booked</span>
                    <span class="text-blue-400 font-medium">${booked}/${total}</span>
                </div>
                <div class="w-full bg-dark-500 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full transition-all duration-500" style="width: ${total ? (booked / total * 100) : 0}%"></div>
                </div>
            </div>
            <div>
                <div class="flex justify-between text-sm mb-1.5">
                    <span class="text-gray-400">Maintenance</span>
                    <span class="text-yellow-400 font-medium">${maintenance}/${total}</span>
                </div>
                <div class="w-full bg-dark-500 rounded-full h-2">
                    <div class="bg-yellow-500 h-2 rounded-full transition-all duration-500" style="width: ${total ? (maintenance / total * 100) : 0}%"></div>
                </div>
            </div>
        </div>
        <div class="mt-4 pt-4 border-t border-dark-500">
            <div class="flex items-center justify-between">
                <span class="text-sm text-gray-400">Fleet Utilization</span>
                <span class="text-lg font-bold text-white">${total ? Math.round(booked / total * 100) : 0}%</span>
            </div>
        </div>
    `;

    lucide.createIcons();
}

// ===========================
// PHOTO UPLOAD HELPERS
// ===========================
function previewVehiclePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('vehiclePhotoImg');
        const icon = document.getElementById('vehiclePhotoIcon');
        const text = document.getElementById('vehiclePhotoText');
        const overlay = document.getElementById('vehiclePhotoOverlay');
        img.src = e.target.result;
        img.classList.remove('hidden');
        icon.classList.add('hidden');
        text.classList.add('hidden');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        // Store base64 in hidden field for later use
        document.getElementById('vehiclePhotoInput').dataset.preview = e.target.result;
    };
    reader.readAsDataURL(file);
}

function resetVehiclePhotoPreview() {
    const img = document.getElementById('vehiclePhotoImg');
    const icon = document.getElementById('vehiclePhotoIcon');
    const text = document.getElementById('vehiclePhotoText');
    const overlay = document.getElementById('vehiclePhotoOverlay');
    img.src = '';
    img.classList.add('hidden');
    icon.classList.remove('hidden');
    text.classList.remove('hidden');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.getElementById('vehiclePhotoInput').value = '';
    document.getElementById('vehiclePhotoInput').dataset.preview = '';
}

function previewDamagePhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('damagePhotoImg');
        const icon = document.getElementById('damagePhotoIcon');
        const text = document.getElementById('damagePhotoText');
        const overlay = document.getElementById('damagePhotoOverlay');
        img.src = e.target.result;
        img.classList.remove('hidden');
        icon.classList.add('hidden');
        text.classList.add('hidden');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        document.getElementById('damagePhotoInput').dataset.preview = e.target.result;
    };
    reader.readAsDataURL(file);
}

function resetDamagePhotoPreview() {
    const img = document.getElementById('damagePhotoImg');
    const icon = document.getElementById('damagePhotoIcon');
    const text = document.getElementById('damagePhotoText');
    const overlay = document.getElementById('damagePhotoOverlay');
    img.src = '';
    img.classList.add('hidden');
    icon.classList.remove('hidden');
    text.classList.remove('hidden');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    document.getElementById('damagePhotoInput').value = '';
    document.getElementById('damagePhotoInput').dataset.preview = '';
}

function previewUserAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('userAvatarPreview').src = e.target.result;
        document.getElementById('userAvatarInput').dataset.preview = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===========================
// VEHICLES
// ===========================
function renderVehicles() {
    const statusFilter = document.getElementById('filterVehicleStatus').value;
    const typeFilter = document.getElementById('filterVehicleType').value;

    let filtered = [...store.vehicles];
    if (statusFilter !== 'all') filtered = filtered.filter(v => v.status === statusFilter);
    if (typeFilter !== 'all') filtered = filtered.filter(v => v.type === typeFilter);

    const grid = document.getElementById('vehiclesGrid');

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i data-lucide="car" class="w-12 h-12 text-gray-600 mx-auto mb-3"></i>
                <p class="text-gray-500">No vehicles found matching your filters.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    grid.innerHTML = filtered.map(v => {
        const statusClass = {
            'Available': 'badge-available',
            'Booked': 'badge-booked',
            'Maintenance': 'badge-maintenance',
        }[v.status] || 'badge-available';

        const typeIcon = {
            'Sedan': 'car',
            'SUV': 'car',
            'Hatchback': 'car',
            'Electric': 'battery-charging',
            'Hybrid': 'leaf',
            'Sports': 'zap',
            'Truck': 'truck',
            'Van': 'car',
            'Luxury': 'sparkles',
        }[v.type] || 'car';

        const imgSrc = v.photo || `https://picsum.photos/seed/vehicle-${v.id}/640/360`;

        return `
            <div class="vehicle-card bg-dark-700 border border-dark-500 rounded-xl overflow-hidden">
                <div class="h-40 bg-dark-600 relative overflow-hidden">
                    <img src="${imgSrc}" alt="${v.make} ${v.model}" class="w-full h-full object-cover opacity-80">
                    <div class="absolute top-3 right-3">
                        <span class="${statusClass} text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">${v.status}</span>
                    </div>
                </div>
                <div class="p-5">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold text-white">${v.make} ${v.model}</h4>
                            <p class="text-xs text-gray-500">${v.id} · ${v.year}</p>
                        </div>
                        <div class="flex items-center gap-1.5 text-accent">
                            <i data-lucide="${typeIcon}" class="w-4 h-4"></i>
                            <span class="text-xs font-medium">${v.type}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-gray-500 mt-3 mb-4">
                        <span class="flex items-center gap-1"><i data-lucide="hash" class="w-3 h-3"></i>${v.plate}</span>
                        <span class="flex items-center gap-1"><i data-lucide="dollar-sign" class="w-3 h-3"></i>${v.rate}/day</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editVehicle('${String(v.id)}')" class="flex-1 flex items-center justify-center gap-1.5 py-2 bg-dark-600 hover:bg-dark-500 text-white text-xs font-medium rounded-lg transition-colors">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>Edit
                        </button>
                        <button onclick="deleteItem('vehicle', '${String(v.id)}')" class="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function openVehicleModal(editId = null) {
    const modal = document.getElementById('vehicleModal');
    const title = document.getElementById('vehicleModalTitle');
    const form = document.getElementById('vehicleForm');

    form.reset();
    document.getElementById('vehicleEditId').value = '';
    resetVehiclePhotoPreview();

    if (editId) {
        const vehicle = store.vehicles.find(v => String(v.id) === String(editId));
        if (!vehicle) return;
        title.textContent = 'Edit Vehicle';
        document.getElementById('vehicleEditId').value = vehicle.id;
        document.getElementById('vehicleMake').value = vehicle.make;
        document.getElementById('vehicleModel').value = vehicle.model;
        document.getElementById('vehicleYear').value = vehicle.year;
        document.getElementById('vehicleType').value = vehicle.type;
        document.getElementById('vehicleFuel').value = vehicle.fuel || 'Petrol';
        document.getElementById('vehiclePlate').value = vehicle.plate;
        document.getElementById('vehicleRate').value = vehicle.rate;
        document.getElementById('vehicleStatus').value = vehicle.status;
        // If existing photo, show it
        if (vehicle.photo) {
            const img = document.getElementById('vehiclePhotoImg');
            const icon = document.getElementById('vehiclePhotoIcon');
            const text = document.getElementById('vehiclePhotoText');
            const overlay = document.getElementById('vehiclePhotoOverlay');
            img.src = vehicle.photo;
            img.classList.remove('hidden');
            icon.classList.add('hidden');
            text.classList.add('hidden');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            document.getElementById('vehiclePhotoInput').dataset.preview = vehicle.photo;
        }
    } else {
        title.textContent = 'Add Vehicle';
    }

    modal.classList.remove('hidden');
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.add('hidden');
}

function editVehicle(id) {
    openVehicleModal(id);
}

async function saveVehicle(e) {
    e.preventDefault();

    const editId = document.getElementById('vehicleEditId').value;
    const make = document.getElementById('vehicleMake').value.trim();
    const model = document.getElementById('vehicleModel').value.trim();
    const year = parseInt(document.getElementById('vehicleYear').value);
    const type = document.getElementById('vehicleType').value;
    const fuel = document.getElementById('vehicleFuel').value;
    const plate = document.getElementById('vehiclePlate').value.trim().toUpperCase();
    const rate = parseInt(document.getElementById('vehicleRate').value);
    const status = document.getElementById('vehicleStatus').value;
    const photo = document.getElementById('vehiclePhotoInput').dataset.preview || null;

    if (!make || !model || !year || !type || !fuel || !plate || !rate || !status) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        if (editId) {
            const idx = store.vehicles.findIndex(v => String(v.id) === String(editId));
            if (idx !== -1) {
                const updatedVehicle = {
                    ...store.vehicles[idx],
                    make,
                    model,
                    year,
                    type,
                    fuel,
                    plate,
                    rate,
                    status,
                    photo: photo || store.vehicles[idx].photo
                };

                const response = await fetch(`${VEHICLE_API_URL}/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mapVehicleToApi(updatedVehicle))
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Update failed (${response.status}): ${errorText}`);
                }
                store.vehicles[idx] = mapVehicleFromApi(await response.json());
                showToast(`Vehicle ${editId} updated successfully`, 'success');
            }
        } else {
            const newVehicle = {
                id: String(vehicleCounter++),
                make,
                model,
                year,
                type,
                fuel,
                plate,
                rate,
                status,
                photo
            };
            const response = await fetch(VEHICLE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mapVehicleToApi(newVehicle))
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Create failed (${response.status}): ${errorText}`);
            }
            const created = mapVehicleFromApi(await response.json());
            store.vehicles.push(created);
            showToast(`Vehicle ${created.id} added successfully`, 'success');
        }

        closeVehicleModal();
        renderVehicles();
        refreshDashboard();
    } catch (error) {
        console.error(error);
        showToast('Could not save vehicle to database', 'error');
    }
}

// ===========================
// BOOKINGS
// ===========================
function renderBookings() {
    const statusFilter = document.getElementById('filterBookingStatus').value;

    let filtered = [...store.bookings];
    if (statusFilter !== 'all') filtered = filtered.filter(b => b.status === statusFilter);
    filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    const tbody = document.getElementById('bookingsTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12">
                    <i data-lucide="calendar-x" class="w-10 h-10 text-gray-600 mx-auto mb-2"></i>
                    <p class="text-gray-500">No bookings found.</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = filtered.map(b => {
        const vehicle = store.vehicles.find(v => String(v.id) === String(b.vehicleId));
        const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : b.vehicleId;
        const statusClass = {
            'Pending': 'badge-pending',
            'Confirmed': 'badge-confirmed',
            'Completed': 'badge-completed',
            'Cancelled': 'badge-cancelled',
        }[b.status] || 'badge-pending';
        const dateRange = `${formatDate(b.startDate)} — ${formatDate(b.endDate)}`;

        return `
            <tr class="border-b border-dark-500/50">
                <td class="px-5 py-3 text-sm font-mono text-white">${b.id}</td>
                <td class="px-5 py-3 text-sm text-gray-300">${b.customer}</td>
                <td class="px-5 py-3 text-sm text-gray-300">${vehicleLabel}</td>
                <td class="px-5 py-3 text-sm text-gray-400">${dateRange}</td>
                <td class="px-5 py-3"><span class="${statusClass} text-xs px-2.5 py-1 rounded-full font-medium">${b.status}</span></td>
                <td class="px-5 py-3 text-sm text-white font-medium">$${Number(b.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="px-5 py-3">
                    <div class="flex items-center gap-1">
                        <button onclick="editBooking(${b.id})" class="p-1.5 hover:bg-dark-500 rounded-lg transition-colors" title="Edit">
                            <i data-lucide="edit-3" class="w-4 h-4 text-gray-400"></i>
                        </button>
                        <button onclick="deleteItem('booking', ${b.id})" class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function openBookingModal(editId = null) {
    const modal = document.getElementById('bookingModal');
    const title = document.getElementById('bookingModalTitle');
    const form = document.getElementById('bookingForm');

    form.reset();
    document.getElementById('bookingEditId').value = '';

    const vehicleSelect = document.getElementById('bookingVehicle');
    vehicleSelect.innerHTML = '<option value="">Select a vehicle</option>';
    store.vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.make} ${v.model} (${v.id})`;
        vehicleSelect.appendChild(opt);
    });

    const linkSel = document.getElementById('bookingLinkedUser');
    if (linkSel) {
        linkSel.innerHTML = '<option value="">Guest only (no app account)</option>';
        store.users.forEach(u => {
            if (u.numericId != null) {
                const opt = document.createElement('option');
                opt.value = String(u.numericId);
                opt.textContent = `${u.firstName} ${u.lastName} (${u.email})`;
                linkSel.appendChild(opt);
            }
        });
    }

    if (editId !== null && editId !== undefined && editId !== '') {
        const booking = store.bookings.find(b => String(b.id) === String(editId));
        if (!booking) return;
        title.textContent = 'Edit Booking';
        document.getElementById('bookingEditId').value = booking.id;
        document.getElementById('bookingCustomer').value = booking.customer;
        const ge = document.getElementById('bookingGuestEmail');
        if (ge) ge.value = booking.guestEmail || '';
        if (linkSel) linkSel.value = booking.userId ? String(booking.userId) : '';
        document.getElementById('bookingVehicle').value = String(booking.vehicleId);
        document.getElementById('bookingStart').value = booking.startDate;
        document.getElementById('bookingEnd').value = booking.endDate;
        document.getElementById('bookingStatus').value = booking.status;
        const pt = document.getElementById('bookingPlanType');
        if (pt) pt.value = booking.planType || 'WEEKLY';
        const pm = document.getElementById('bookingPayment');
        if (pm) pm.value = booking.paymentMethod || 'Cash';
        document.getElementById('bookingAmount').value = Number(booking.amount || 0).toFixed(2);
    } else {
        title.textContent = 'New Booking';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('bookingStart').value = today;
        const end = new Date();
        end.setDate(end.getDate() + 3);
        document.getElementById('bookingEnd').value = end.toISOString().split('T')[0];
        const pt = document.getElementById('bookingPlanType');
        if (pt) pt.value = 'WEEKLY';
        const pm = document.getElementById('bookingPayment');
        if (pm) pm.value = 'Cash';
    }

    autoCalcBookingAmount();
    modal.classList.remove('hidden');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.add('hidden');
}

function editBooking(id) {
    openBookingModal(id);
}

async function saveBooking(e) {
    e.preventDefault();

    const editId = document.getElementById('bookingEditId').value;
    const customer = document.getElementById('bookingCustomer').value.trim();
    const guestEmail = document.getElementById('bookingGuestEmail')?.value?.trim() || '';
    const linkedRaw = document.getElementById('bookingLinkedUser')?.value || '';
    const vehicleId = document.getElementById('bookingVehicle').value;
    const startDate = document.getElementById('bookingStart').value;
    const endDate = document.getElementById('bookingEnd').value;
    const status = document.getElementById('bookingStatus').value;
    const planType = document.getElementById('bookingPlanType')?.value || 'DAILY';
    const paymentMethod = document.getElementById('bookingPayment')?.value || 'Cash';

    if (!customer || !vehicleId || !startDate || !endDate || !status) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
        showToast('End date must be after start date', 'error');
        return;
    }

    const payload = {
        userId: linkedRaw ? Number(linkedRaw) : null,
        guestName: customer,
        guestEmail: guestEmail || null,
        vehicleId: Number(vehicleId),
        pickupDate: startDate,
        returnDate: endDate,
        planType,
        paymentMethod,
        status
    };

    try {
        if (editId) {
            const response = await fetch(`${BOOKINGS_API_URL}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || `Update failed (${response.status})`);
            }
            showToast(`Booking #${editId} updated`, 'success');
        } else {
            const response = await fetch(BOOKINGS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || `Create failed (${response.status})`);
            }
            const created = await response.json();
            showToast(`Booking #${created.id} created`, 'success');
        }

        await loadBookingsFromDb();
        await loadVehiclesFromDb();
        closeBookingModal();
        renderBookings();
        renderVehicles();
        refreshDashboard();
    } catch (error) {
        console.error(error);
        showToast(String(error.message || error).slice(0, 220), 'error');
    }
}

// ===========================
// DAMAGE REPORTS
// ===========================
function renderDamages() {
    const severityFilter = document.getElementById('filterDamageSeverity').value;
    const statusFilter = document.getElementById('filterDamageStatus').value;

    let filtered = [...store.damages];
    if (severityFilter !== 'all') filtered = filtered.filter(d => d.severity === severityFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(d => d.status === statusFilter);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('damagesTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12">
                    <i data-lucide="shield-check" class="w-10 h-10 text-gray-600 mx-auto mb-2"></i>
                    <p class="text-gray-500">No damage reports found.</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const vehicle = store.vehicles.find(v => v.id === d.vehicleId);
        const vehicleLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : d.vehicleId;
        const severityClass = {
            'Low': 'badge-low',
            'Medium': 'badge-medium',
            'High': 'badge-high',
            'Critical': 'badge-critical',
        }[d.severity] || 'badge-low';
        const statusClass = {
            'Reported': 'badge-reported',
            'Under Review': 'badge-under-review',
            'Repairing': 'badge-repairing',
            'Resolved': 'badge-resolved',
        }[d.status] || 'badge-reported';
        const truncatedDesc = d.description.length > 50 ? d.description.substring(0, 50) + '...' : d.description;

        const photoThumb = d.photo
            ? `<img src="${d.photo}" class="w-8 h-8 rounded object-cover border border-dark-400 inline-block mr-2 align-middle" title="View damage photo">`
            : '';

        return `
            <tr class="border-b border-dark-500/50">
                <td class="px-5 py-3 text-sm font-mono text-white">${d.id}</td>
                <td class="px-5 py-3 text-sm text-gray-300">${vehicleLabel}</td>
                <td class="px-5 py-3 text-sm text-gray-400" title="${d.description}">${photoThumb}${truncatedDesc}</td>
                <td class="px-5 py-3"><span class="${severityClass} text-xs px-2.5 py-1 rounded-full font-medium">${d.severity}</span></td>
                <td class="px-5 py-3"><span class="${statusClass} text-xs px-2.5 py-1 rounded-full font-medium">${d.status}</span></td>
                <td class="px-5 py-3 text-sm text-gray-400">${formatDate(d.date)}</td>
                <td class="px-5 py-3">
                    <div class="flex items-center gap-1">
                        <button onclick="editDamage(${d.id})" class="p-1.5 hover:bg-dark-500 rounded-lg transition-colors" title="Edit">
                            <i data-lucide="edit-3" class="w-4 h-4 text-gray-400"></i>
                        </button>
                        <button onclick="deleteItem('damage', ${d.id})" class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function openDamageModal(editId = null) {
    const modal = document.getElementById('damageModal');
    const title = document.getElementById('damageModalTitle');
    const form = document.getElementById('damageForm');

    form.reset();
    document.getElementById('damageEditId').value = '';
    resetDamagePhotoPreview();

    const vehicleSelect = document.getElementById('damageVehicle');
    vehicleSelect.innerHTML = '<option value="">Select a vehicle</option>';
    store.vehicles.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = `${v.make} ${v.model} (${v.id})`;
        vehicleSelect.appendChild(opt);
    });

    const reporterSelect = document.getElementById('damageReporterUser');
    reporterSelect.innerHTML = '<option value="">Select customer</option>';
    store.users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = String(u.numericId);
        opt.textContent = `${u.firstName} ${u.lastName} (${u.email})`;
        reporterSelect.appendChild(opt);
    });

    if (editId) {
        const damage = store.damages.find(d => String(d.id) === String(editId));
        if (!damage) return;
        title.textContent = 'Edit Damage Report';
        document.getElementById('damageEditId').value = String(damage.id);
        document.getElementById('damageVehicle').value = damage.vehicleId;
        if (damage.userId != null) {
            document.getElementById('damageReporterUser').value = String(damage.userId);
        }
        document.getElementById('damageDescription').value = damage.description;
        document.getElementById('damageSeverity').value = damage.severity;
        document.getElementById('damageStatus').value = damage.status;
        document.getElementById('damageCost').value = damage.cost || '';
        if (damage.photo) {
            const img = document.getElementById('damagePhotoImg');
            const icon = document.getElementById('damagePhotoIcon');
            const text = document.getElementById('damagePhotoText');
            const overlay = document.getElementById('damagePhotoOverlay');
            img.src = damage.photo;
            img.classList.remove('hidden');
            icon.classList.add('hidden');
            text.classList.add('hidden');
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
            document.getElementById('damagePhotoInput').dataset.preview = damage.photo;
        }
    } else {
        title.textContent = 'New Damage Report';
    }

    modal.classList.remove('hidden');
}

function closeDamageModal() {
    document.getElementById('damageModal').classList.add('hidden');
}

function editDamage(id) {
    openDamageModal(id);
}

async function saveDamage(e) {
    e.preventDefault();

    const editId = document.getElementById('damageEditId').value;
    const vehicleId = document.getElementById('damageVehicle').value;
    const userIdRaw = document.getElementById('damageReporterUser').value;
    const description = document.getElementById('damageDescription').value.trim();
    const severity = document.getElementById('damageSeverity').value;
    const status = document.getElementById('damageStatus').value;
    const cost = parseInt(document.getElementById('damageCost').value, 10) || 0;
    const photo = document.getElementById('damagePhotoInput').dataset.preview || '';

    if (!userIdRaw || !vehicleId || !description || !severity || !status) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    let incidentDate = new Date().toISOString().split('T')[0];
    if (editId) {
        const existing = store.damages.find(d => String(d.id) === String(editId));
        if (existing?.date) {
            incidentDate = existing.date;
        }
    }

    const payload = {
        userId: Number(userIdRaw),
        vehicleId: Number(vehicleId),
        description,
        severity,
        status,
        incidentDate,
        estimatedCost: cost
    };
    if (photo) {
        payload.photo = photo;
    }

    try {
        if (editId) {
            const response = await fetch(`${DAMAGE_API_URL}/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || `Update failed (${response.status})`);
            }
            showToast(`Report #${editId} updated`, 'success');
        } else {
            const response = await fetch(`${DAMAGE_API_URL}/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || `Create failed (${response.status})`);
            }
            const created = await response.json();
            showToast(`Damage report #${created.id} created`, 'success');
        }

        await loadDamagesFromDb();
        closeDamageModal();
        renderDamages();
        refreshDashboard();
    } catch (error) {
        console.error(error);
        showToast(String(error.message || error).slice(0, 220), 'error');
    }
}

// ===========================
// USERS
// ===========================
function getAvatarSrc(user) {
    if (user.avatar) return user.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.firstName + user.lastName)}&backgroundColor=2D2D2D`;
}

function renderUsers() {
    const roleFilter = document.getElementById('filterUserRole').value;
    const statusFilter = document.getElementById('filterUserStatus').value;

    let filtered = [...store.users];
    if (roleFilter !== 'all') filtered = filtered.filter(u => u.role === roleFilter);
    if (statusFilter !== 'all') filtered = filtered.filter(u => u.status === statusFilter);

    // Update stats
    document.getElementById('stat-total-users').textContent = store.users.length;
    document.getElementById('stat-active-users').textContent = store.users.filter(u => u.status === 'Active').length;
    document.getElementById('stat-admin-users').textContent = store.users.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length;

    const tbody = document.getElementById('usersTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12">
                    <i data-lucide="users" class="w-10 h-10 text-gray-600 mx-auto mb-2"></i>
                    <p class="text-gray-500">No users found.</p>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = filtered.map(u => {
        const fullName = `${u.firstName} ${u.lastName}`;
        const avatarSrc = getAvatarSrc(u);
        const roleClass = {
            'Super Admin': 'bg-accent/20 text-accent',
            'Admin': 'bg-purple-500/20 text-purple-400',
            'Manager': 'bg-blue-500/20 text-blue-400',
            'Staff': 'bg-gray-500/20 text-gray-400',
        }[u.role] || 'bg-gray-500/20 text-gray-400';

        const statusClass = {
            'Active': 'badge-available',
            'Inactive': 'badge-maintenance',
            'Suspended': 'badge-cancelled',
        }[u.status] || 'badge-available';

        return `
            <tr class="border-b border-dark-500/50">
                <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                        <img src="${avatarSrc}" alt="${fullName}" class="w-9 h-9 rounded-full object-cover border border-dark-400 bg-dark-600">
                        <div>
                            <p class="text-sm font-medium text-white">${fullName}</p>
                            <p class="text-xs text-gray-500">${u.id}</p>
                        </div>
                    </div>
                </td>
                <td class="px-5 py-3">
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full ${roleClass}">${u.role}</span>
                </td>
                <td class="px-5 py-3 text-sm text-gray-300">${u.email}</td>
                <td class="px-5 py-3 text-sm text-gray-400">${u.phone || '—'}</td>
                <td class="px-5 py-3"><span class="${statusClass} text-xs px-2.5 py-1 rounded-full font-medium">${u.status}</span></td>
                <td class="px-5 py-3 text-sm text-gray-400">${formatDate(u.joined)}</td>
                <td class="px-5 py-3">
                    <div class="flex items-center gap-1">
                        <button onclick="editUser('${u.id}')" class="p-1.5 hover:bg-dark-500 rounded-lg transition-colors" title="Edit">
                            <i data-lucide="edit-3" class="w-4 h-4 text-gray-400"></i>
                        </button>
                        <button onclick="deleteItem('user', '${u.id}')" class="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-400"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

function openUserModal(editId = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('userModalTitle');
    const form = document.getElementById('userForm');

    form.reset();
    document.getElementById('userEditId').value = '';
    document.getElementById('userAvatarPreview').src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=new&backgroundColor=2D2D2D';
    document.getElementById('userAvatarInput').value = '';
    document.getElementById('userAvatarInput').dataset.preview = '';

    if (editId) {
        const user = store.users.find(u => u.id === editId);
        if (!user) return;
        title.textContent = 'Edit User';
        document.getElementById('userEditId').value = user.id;
        document.getElementById('userFirstName').value = user.firstName;
        document.getElementById('userLastName').value = user.lastName;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userRole').value = user.role;
        document.getElementById('userStatus').value = user.status;
        document.getElementById('userAvatarPreview').src = getAvatarSrc(user);
        if (user.avatar) document.getElementById('userAvatarInput').dataset.preview = user.avatar;
    } else {
        title.textContent = 'Add User';
    }

    modal.classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

function editUser(id) {
    openUserModal(id);
}

function saveUser(e) {
    e.preventDefault();

    const editId = document.getElementById('userEditId').value;
    const firstName = document.getElementById('userFirstName').value.trim();
    const lastName = document.getElementById('userLastName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;
    const avatar = document.getElementById('userAvatarInput').dataset.preview || null;

    if (!firstName || !lastName || !email || !role || !status) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (editId) {
        const idx = store.users.findIndex(u => u.id === editId);
        if (idx !== -1) {
            store.users[idx] = { ...store.users[idx], firstName, lastName, email, phone, role, status, avatar: avatar || store.users[idx].avatar };
            showToast(`User ${editId} updated successfully`, 'success');
        }
    } else {
        const newId = `USR-${String(userCounter++).padStart(3, '0')}`;
        const today = new Date().toISOString().split('T')[0];
        store.users.push({ id: newId, firstName, lastName, email, phone, role, status, joined: today, avatar });
        showToast(`User ${newId} added successfully`, 'success');
    }

    closeUserModal();
    renderUsers();
}

// ===========================
// DELETE
// ===========================
function deleteItem(type, id) {
    store.deleteContext = { type, id };

    const labels = {
        vehicle: 'vehicle',
        booking: 'booking',
        damage: 'damage report',
        user: 'user',
    };
    document.getElementById('deleteMessage').textContent =
        `Are you sure you want to delete this ${labels[type]} (${id})? This action cannot be undone.`;

    document.getElementById('deleteModal').classList.remove('hidden');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    store.deleteContext = null;
}

async function confirmDelete() {
    if (!store.deleteContext) return;

    const { type, id } = store.deleteContext;

    switch (type) {
        case 'vehicle':
            try {
                const response = await fetch(`${VEHICLE_API_URL}/${id}`, { method: 'DELETE' });
                if (!response.ok && response.status !== 204) {
                    throw new Error(`Delete failed (${response.status})`);
                }
                store.vehicles = store.vehicles.filter(v => String(v.id) !== String(id));
            } catch (error) {
                console.error(error);
                showToast('Could not delete vehicle from database', 'error');
                return;
            }
            renderVehicles();
            break;
        case 'booking':
            try {
                const response = await fetch(`${BOOKINGS_API_URL}/${id}`, { method: 'DELETE' });
                if (!response.ok && response.status !== 204) {
                    throw new Error(`Delete failed (${response.status})`);
                }
                await loadBookingsFromDb();
                await loadVehiclesFromDb();
            } catch (error) {
                console.error(error);
                showToast('Could not delete booking', 'error');
                return;
            }
            renderBookings();
            renderVehicles();
            break;
        case 'damage':
            try {
                const response = await fetch(`${DAMAGE_API_URL}/${id}`, { method: 'DELETE' });
                if (!response.ok && response.status !== 204) {
                    throw new Error(`Delete failed (${response.status})`);
                }
                await loadDamagesFromDb();
            } catch (error) {
                console.error(error);
                showToast('Could not delete damage report', 'error');
                return;
            }
            renderDamages();
            break;
        case 'user':
            store.users = store.users.filter(u => u.id !== id);
            renderUsers();
            break;
    }

    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} ${id} deleted`, 'success');
    closeDeleteModal();
    refreshDashboard();
}

// ===========================
// ADMIN PROFILE (View Only)
// ===========================
function openAdminProfile() {
    const admin = store.admin;
    document.getElementById('adminProfileName').textContent = admin.name;
    document.getElementById('adminProfileRole').textContent = admin.role;
    document.getElementById('adminProfileEmail').textContent = admin.email;
    document.getElementById('adminProfilePhone').textContent = admin.phone;
    document.getElementById('adminProfileLocation').textContent = admin.location;
    document.getElementById('adminProfileJoined').textContent = `Joined: ${admin.joined}`;
    document.getElementById('adminProfileModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeAdminProfile() {
    document.getElementById('adminProfileModal').classList.add('hidden');
}

function handleLogout() {
    closeAdminProfile();
    localStorage.removeItem('driveRedAdminAuth');
    showToast('Logged out successfully. Redirecting to homepage...', 'info');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 500);
}

// ===========================
// UTILITY
// ===========================
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVehicleModal();
        closeBookingModal();
        closeDamageModal();
        closeDeleteModal();
        closeAdminProfile();
        closeUserModal();
        const notifPanel = document.getElementById('notifPanel');
        if (!notifPanel.classList.contains('hidden')) {
            notifPanel.classList.add('hidden');
        }
    }
});

// ===========================
// AUTO-CALCULATE BOOKING AMOUNT (matches server: package segments + daily tail)
// ===========================
function adminAddCalendarMonths(date, months) {
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < day) d.setDate(0);
    return d;
}

function adminAddOneYear(date) {
    const d = new Date(date.getTime());
    d.setFullYear(d.getFullYear() + 1);
    return d;
}

function adminComputeSubtotal(startDate, endDate, planType, pd) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (days < 1 || pd <= 0) return 0;
    const planU = String(planType || 'DAILY').toUpperCase();
    if (planU === 'DAILY') return Math.round(days * pd * 100) / 100;
    const discMap = { DAILY: 0, WEEKLY: 11, MONTHLY: 27, YEARLY: 42 };
    const disc = (discMap[planU] ?? 0) / 100;
    let pos = new Date(start.getTime());
    let sub = 0;
    while (pos < end) {
        let boundary;
        if (planU === 'WEEKLY') {
            boundary = new Date(pos.getTime());
            boundary.setDate(boundary.getDate() + 7);
        } else if (planU === 'MONTHLY') {
            boundary = adminAddCalendarMonths(pos, 1);
        } else if (planU === 'YEARLY') {
            boundary = adminAddOneYear(pos);
        } else {
            boundary = new Date(pos.getTime());
            boundary.setDate(boundary.getDate() + 1);
        }
        const segEnd = boundary < end ? boundary : end;
        const ddays = Math.round((segEnd - pos) / (1000 * 60 * 60 * 24));
        if (ddays <= 0) break;
        const fullSeg = segEnd.getTime() === boundary.getTime();
        if (fullSeg) sub += ddays * pd * (1 - disc);
        else sub += ddays * pd;
        pos = segEnd;
    }
    return Math.round(sub * 100) / 100;
}

document.addEventListener('change', (e) => {
    if (
        e.target.id === 'bookingStart' ||
        e.target.id === 'bookingEnd' ||
        e.target.id === 'bookingVehicle' ||
        e.target.id === 'bookingPlanType' ||
        e.target.id === 'bookingPayment'
    ) {
        autoCalcBookingAmount();
    }
});

function autoCalcBookingAmount() {
    const vehicleId = document.getElementById('bookingVehicle').value;
    const startDate = document.getElementById('bookingStart').value;
    const endDate = document.getElementById('bookingEnd').value;
    const planType = document.getElementById('bookingPlanType')?.value || 'DAILY';

    if (vehicleId && startDate && endDate) {
        const vehicle = store.vehicles.find(v => String(v.id) === String(vehicleId));
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const days = Math.round((end - start) / (1000 * 60 * 60 * 24));

        if (vehicle && days > 0) {
            const pd = Number(vehicle.rate || 0);
            const subtotal = adminComputeSubtotal(startDate, endDate, planType, pd);
            const insurance = Math.round(Math.min(10 * days, 700) * 100) / 100;
            const serviceFee = 15;
            const tax = Math.round((subtotal + insurance + serviceFee) * 0.08 * 100) / 100;
            const total = Math.round((subtotal + insurance + serviceFee + tax) * 100) / 100;
            document.getElementById('bookingAmount').value = total.toFixed(2);
        }
    }
}

// ===========================
// INIT
// ===========================
async function init() {
    lucide.createIcons();
    try {
        await loadVehiclesFromDb();
    } catch (error) {
        console.error(error);
        showToast('Failed to load vehicles from database', 'error');
    }
    try {
        await loadUsersFromDb();
    } catch (error) {
        console.error(error);
        showToast('Failed to load users from database', 'error');
    }
    try {
        await loadBookingsFromDb();
    } catch (error) {
        console.error(error);
        showToast('Failed to load bookings from database', 'error');
    }
    try {
        await loadDamagesFromDb();
    } catch (error) {
        console.error(error);
        showToast('Failed to load damage reports from database', 'error');
    }
    refreshDashboard();
    renderVehicles();
    renderBookings();
    renderDamages();
    renderUsers();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}