const PROFILE_API_BASE = '/api/auth/profile';

function getSessionUser() {
    try {
        const raw = localStorage.getItem('driveRedUserSession');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Could not parse user session:', error);
        return null;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderProfile(profile) {
    const user = profile.user;
    document.getElementById('profileName').textContent = user.name || '-';
    document.getElementById('profileEmail').textContent = user.email || '-';
    document.getElementById('profilePhone').textContent = user.phone || '-';
    document.getElementById('joinedAt').textContent = formatDate(user.createdAt);
    document.getElementById('bookingsCount').textContent = String(profile.bookings.length);
    document.getElementById('damageCount').textContent = String(profile.damageReports.length);

    const avatar = document.getElementById('profileAvatar');
    avatar.src = user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'drivered-user')}`;

    const bookingContainer = document.getElementById('bookingHistoryList');
    if (!profile.bookings.length) {
        bookingContainer.innerHTML = '<p class="text-sm text-gray-500">No bookings yet.</p>';
    } else {
        bookingContainer.innerHTML = profile.bookings.map((b) => `
            <div class="history-item">
                <p class="history-title">${b.vehicleBrand} ${b.vehicleName}</p>
                <p class="history-sub">${formatDate(b.startDate)} - ${formatDate(b.endDate)}</p>
                <p class="history-sub">Status: ${b.status} • Total: $${b.totalAmount ?? 0}</p>
            </div>
        `).join('');
    }

    const damageContainer = document.getElementById('damageReportsList');
    if (!profile.damageReports.length) {
        damageContainer.innerHTML = '<p class="text-sm text-gray-500">No damage reports yet.</p>';
    } else {
        damageContainer.innerHTML = profile.damageReports.map((d) => `
            <div class="history-item">
                <p class="history-title">${d.vehicleName} • ${d.severity}</p>
                <p class="history-sub">${d.description || '-'}</p>
                <p class="history-sub">${formatDate(d.incidentDate)} • ${d.status} • Cost: $${d.estimatedCost ?? 0}</p>
            </div>
        `).join('');
    }
}

async function loadProfile(userId) {
    const response = await fetch(`${PROFILE_API_BASE}/${userId}`);
    if (!response.ok) {
        throw new Error(`Failed to load profile (${response.status})`);
    }
    return response.json();
}

async function uploadProfilePhoto(userId, imageUrl) {
    const response = await fetch(`${PROFILE_API_BASE}/${userId}/photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
    });
    if (!response.ok) {
        throw new Error(`Failed to upload profile photo (${response.status})`);
    }
    return response.json();
}

function wirePhotoUpload(userId) {
    const input = document.getElementById('profilePhotoInput');
    const trigger = document.getElementById('changePhotoBtn');
    trigger.addEventListener('click', () => input.click());
    input.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const updatedUser = await uploadProfilePhoto(userId, reader.result);
                const session = getSessionUser();
                if (session) {
                    localStorage.setItem('driveRedUserSession', JSON.stringify(updatedUser));
                }
                document.getElementById('profileAvatar').src = updatedUser.profileImageUrl || document.getElementById('profileAvatar').src;
            } catch (error) {
                console.error(error);
                alert('Could not upload profile photo.');
            }
        };
        reader.readAsDataURL(file);
    });
}

async function initProfile() {
    const sessionUser = getSessionUser();
    if (!sessionUser?.id) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const profile = await loadProfile(sessionUser.id);
        renderProfile(profile);
        wirePhotoUpload(sessionUser.id);
    } catch (error) {
        console.error(error);
        alert('Could not load profile data.');
    }
}

document.addEventListener('DOMContentLoaded', initProfile);
