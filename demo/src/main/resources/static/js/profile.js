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
                <p class="history-title">${d.vehicleBrand ? d.vehicleBrand + ' ' : ''}${d.vehicleName} • ${d.severity}</p>
                <p class="history-sub">${d.description || '-'}</p>
                <p class="history-sub">${formatDate(d.incidentDate)} • ${d.status} • Cost: $${d.estimatedCost ?? 0}${d.rentalBookingId != null ? ` • Rental #${d.rentalBookingId}` : ''}${d.plateNumber ? ` • ${d.plateNumber}` : ''}</p>
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

async function updateProfileInfo(userId, payload) {
    const response = await fetch(`${PROFILE_API_BASE}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to update profile (${response.status})`);
    }
    return response.json();
}

async function updatePassword(userId, payload) {
    const response = await fetch(`${PROFILE_API_BASE}/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to update password (${response.status})`);
    }
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

function openEditModal(user) {
    document.getElementById('editName').value = user.name || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editProfileStatus').classList.add('hidden');
    const modal = document.getElementById('editProfileModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function openPasswordModal() {
    document.getElementById('changePasswordStatus').classList.add('hidden');
    document.getElementById('changePasswordForm')?.reset();
    const modal = document.getElementById('changePasswordModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function wireEditProfile(userId, initialUser) {
    document.getElementById('editProfileBtn')?.addEventListener('click', () => openEditModal(initialUser));
    document.getElementById('closeEditProfileBtn')?.addEventListener('click', closeEditModal);
    document.getElementById('editProfileBackdrop')?.addEventListener('click', closeEditModal);

    document.getElementById('editProfileForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const statusEl = document.getElementById('editProfileStatus');

        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();

        try {
            const updated = await updateProfileInfo(userId, { name, email, phone });
            localStorage.setItem('driveRedUserSession', JSON.stringify(updated));
            document.getElementById('profileName').textContent = updated.name || '-';
            document.getElementById('profileEmail').textContent = updated.email || '-';
            document.getElementById('profilePhone').textContent = updated.phone || '-';
            statusEl.textContent = 'Saved successfully.';
            statusEl.className = 'text-sm text-green-600';
            statusEl.classList.remove('hidden');
            setTimeout(() => {
                closeEditModal();
                window.location.reload();
            }, 600);
        } catch (error) {
            console.error(error);
            statusEl.textContent = 'Could not save changes.';
            statusEl.className = 'text-sm text-red-600';
            statusEl.classList.remove('hidden');
        }
    });
}

function wirePasswordChange(userId) {
    document.getElementById('changePasswordBtn')?.addEventListener('click', openPasswordModal);
    document.getElementById('closeChangePasswordBtn')?.addEventListener('click', closePasswordModal);
    document.getElementById('changePasswordBackdrop')?.addEventListener('click', closePasswordModal);

    document.getElementById('changePasswordForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const statusEl = document.getElementById('changePasswordStatus');
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            statusEl.textContent = 'New password and confirmation do not match.';
            statusEl.className = 'text-sm text-red-600';
            statusEl.classList.remove('hidden');
            return;
        }

        if (newPassword.length < 8) {
            statusEl.textContent = 'New password must be at least 8 characters.';
            statusEl.className = 'text-sm text-red-600';
            statusEl.classList.remove('hidden');
            return;
        }

        try {
            await updatePassword(userId, { currentPassword, newPassword });
            statusEl.textContent = 'Password updated successfully.';
            statusEl.className = 'text-sm text-green-600';
            statusEl.classList.remove('hidden');
            setTimeout(closePasswordModal, 700);
        } catch (error) {
            console.error(error);
            statusEl.textContent = 'Could not update password. Check current password and try again.';
            statusEl.className = 'text-sm text-red-600';
            statusEl.classList.remove('hidden');
        }
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
        wireEditProfile(sessionUser.id, profile.user);
        wirePasswordChange(sessionUser.id);
    } catch (error) {
        console.error(error);
        alert('Could not load profile data.');
    }
}

document.addEventListener('DOMContentLoaded', initProfile);
