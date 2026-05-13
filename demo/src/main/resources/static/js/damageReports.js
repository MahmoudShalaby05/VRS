tailwind.config = {
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fdf2f2',
          100: '#f9e0e0',
          200: '#f0c4c4',
          300: '#e3a0a0',
          400: '#cf7070',
          500: '#b94545',
          600: '#9a2e2e',
          700: '#7f1d1d',
          800: '#6b1a1a',
          900: '#5c1616',
          950: '#350a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    }
  }
}

// ===== STATE =====
const DAMAGE_API = '/api/damage-reports';
let currentUserId = null;
let eligibleRentals = [];
let selectedBooking = null;
let currentStep = 1;
const totalSteps = 3;
let selectedSeverity = null;
let selectedLocations = new Set();
let uploadedPhotos = [];

function getSessionUser() {
  try {
    const raw = localStorage.getItem('driveRedUserSession');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

function formatBookingDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function clearVehiclePreview() {
  selectedBooking = null;
  document.getElementById('displayPlate').value = '';
  document.getElementById('displayModel').value = '';
  document.getElementById('displayRentalId').value = '';
  document.getElementById('headerRentalId').textContent = '—';
  document.getElementById('vehiclePreviewTitle').textContent = 'Select a rental to load vehicle details';
  document.getElementById('vehiclePreviewPlate').textContent = '—';
  document.getElementById('vehiclePreviewYear').textContent = '—';
  document.getElementById('vehiclePreviewStatus').textContent = '—';
  document.getElementById('vehiclePreviewDates').textContent = 'Pickup: — → Return: —';
  const img = document.getElementById('vehiclePreviewImage');
  img.classList.add('hidden');
  img.removeAttribute('src');
  updateReviewSummary();
}

function applySelectedRental(r) {
  selectedBooking = r;
  document.getElementById('displayPlate').value = r.plateNumber || '—';
  const modelLine = [r.vehicleBrand, r.vehicleName].filter(Boolean).join(' ');
  document.getElementById('displayModel').value =
    modelLine + (r.modelYear != null ? ` · ${r.modelYear}` : '');
  document.getElementById('displayRentalId').value = `#${r.bookingId}`;
  document.getElementById('headerRentalId').textContent = `#${r.bookingId}`;
  document.getElementById('vehiclePreviewTitle').textContent = modelLine || 'Vehicle';
  document.getElementById('vehiclePreviewPlate').textContent = r.plateNumber || '—';
  document.getElementById('vehiclePreviewYear').textContent =
    r.modelYear != null ? String(r.modelYear) : '—';
  document.getElementById('vehiclePreviewStatus').textContent = r.bookingStatus || '—';
  document.getElementById('vehiclePreviewDates').textContent =
    `Pickup: ${formatBookingDate(r.pickupDate)} → Return: ${formatBookingDate(r.returnDate)}`;
  const img = document.getElementById('vehiclePreviewImage');
  if (r.imageUrl) {
    img.src = r.imageUrl;
    img.alt = modelLine || 'Vehicle';
    img.classList.remove('hidden');
  } else {
    img.classList.add('hidden');
    img.removeAttribute('src');
  }
  updateReviewSummary();
}

function onRentalBookingChange() {
  const id = document.getElementById('rentalBookingSelect').value;
  const r = eligibleRentals.find((x) => String(x.bookingId) === String(id));
  if (!r) {
    clearVehiclePreview();
    return;
  }
  applySelectedRental(r);
}

async function loadEligibleRentals() {
  const select = document.getElementById('rentalBookingSelect');
  const hint = document.getElementById('rentalSelectHint');
  select.innerHTML = '<option value="">Choose the booking this damage applies to…</option>';
  eligibleRentals = [];
  try {
    const res = await fetch(`${DAMAGE_API}/eligible-rentals?userId=${encodeURIComponent(currentUserId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    eligibleRentals = await res.json();
  } catch (e) {
    console.error(e);
    showToast('Could not load your rentals. Try again later.', 'error');
    hint.classList.remove('hidden');
    return;
  }
  if (!eligibleRentals.length) {
    hint.classList.remove('hidden');
    return;
  }
  hint.classList.add('hidden');
  eligibleRentals.forEach((r) => {
    const opt = document.createElement('option');
    opt.value = String(r.bookingId);
    const label = `${r.vehicleBrand || ''} ${r.vehicleName || 'Vehicle'} · #${r.bookingId} · ${formatBookingDate(r.pickupDate)} – ${formatBookingDate(r.returnDate)}`;
    opt.textContent = label.trim();
    select.appendChild(opt);
  });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const session = getSessionUser();
  if (!session?.id) {
    window.location.href = 'login.html';
    return;
  }
  currentUserId = session.id;

  await loadEligibleRentals();
  document.getElementById('rentalBookingSelect').addEventListener('change', onRentalBookingChange);

  lucide.createIcons();
  updateStepper();

  // Set today's date as default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('incidentDate').value = today;

  // Character counter
  const desc = document.getElementById('damageDescription');
  desc.addEventListener('input', () => {
    const len = desc.value.length;
    document.getElementById('charCount').textContent = `${len} / 1000`;
    if (len > 1000) desc.value = desc.value.substring(0, 1000);
  });

  // Car location buttons
  document.querySelectorAll('.car-point').forEach(btn => {
    btn.addEventListener('click', () => {
      const loc = btn.dataset.location;
      if (selectedLocations.has(loc)) {
        selectedLocations.delete(loc);
        btn.classList.remove('selected');
      } else {
        selectedLocations.add(loc);
        btn.classList.add('selected');
      }
      updateLocationDisplay();
    });
  });

  // Drag and drop
  const uploadZone = document.getElementById('uploadZone');
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    processFiles(files);
  });

  document.querySelectorAll('.damage-type input').forEach((cb) => {
    cb.addEventListener('change', updateReviewSummary);
  });

  updateReviewSummary();
  renderPhotoGrid();
});

// ===== STEPPER =====
function updateStepper() {
  for (let i = 1; i <= totalSteps; i++) {
    const circle = document.getElementById(`stepCircle${i}`);
    const label = document.getElementById(`stepLabel${i}`);
    const line = i < totalSteps ? document.getElementById(`stepLine${i}`) : null;

    if (i < currentStep) {
      // Completed
      circle.className = 'w-9 h-9 rounded-full bg-maroon-700 text-white flex items-center justify-center text-sm font-bold transition-all duration-300';
      circle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      label.className = 'text-sm font-semibold text-maroon-700 transition-colors';
      if (line) line.className = 'flex-1 h-0.5 bg-maroon-700 mx-4 transition-colors duration-300';
    } else if (i === currentStep) {
      // Active
      circle.className = 'w-9 h-9 rounded-full bg-maroon-700 text-white flex items-center justify-center text-sm font-bold transition-all duration-300 ring-4 ring-maroon-100';
      circle.textContent = i;
      label.className = 'text-sm font-semibold text-maroon-700 transition-colors';
      if (line) line.className = 'flex-1 h-0.5 bg-gray-200 mx-4 transition-colors duration-300';
    } else {
      // Upcoming
      circle.className = 'w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-bold transition-all duration-300';
      circle.textContent = i;
      label.className = 'text-sm font-medium text-gray-400 transition-colors';
      if (line) line.className = 'flex-1 h-0.5 bg-gray-200 mx-4 transition-colors duration-300';
    }
  }

  // Progress bar
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;

  // Buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  if (currentStep === 1) {
    prevBtn.classList.add('hidden');
    prevBtn.classList.remove('flex');
    nextBtn.classList.remove('hidden');
    nextBtn.classList.add('flex');
    submitBtn.classList.add('hidden');
    submitBtn.classList.remove('flex');
  } else if (currentStep === totalSteps) {
    prevBtn.classList.remove('hidden');
    prevBtn.classList.add('flex');
    nextBtn.classList.add('hidden');
    nextBtn.classList.remove('flex');
    submitBtn.classList.remove('hidden');
    submitBtn.classList.add('flex');
  } else {
    prevBtn.classList.remove('hidden');
    prevBtn.classList.add('flex');
    nextBtn.classList.remove('hidden');
    nextBtn.classList.add('flex');
    submitBtn.classList.add('hidden');
    submitBtn.classList.remove('flex');
  }

  // Show/hide steps
  for (let i = 1; i <= totalSteps; i++) {
    const panel = document.getElementById(`step${i}`);
    if (i === currentStep) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  }
}

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepper();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepper();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goToStep(step) {
  if (step < currentStep) {
    currentStep = step;
    updateStepper();
  }
}

// ===== VALIDATION =====
function validateStep(step) {
  if (step === 1) {
    const rentalId = document.getElementById('rentalBookingSelect').value;
    if (!rentalId) {
      showToast('Please select the rental this damage is associated with.', 'error');
      document.getElementById('rentalBookingSelect').focus();
      return false;
    }
    return true;
  }
  if (step === 2) {
    const date = document.getElementById('incidentDate').value;
    const location = document.getElementById('incidentLocation').value;
    const desc = document.getElementById('damageDescription').value;

    if (!date) {
      showToast('Please select the date of incident.', 'error');
      return false;
    }
    if (!location.trim()) {
      showToast('Please enter the location of incident.', 'error');
      document.getElementById('incidentLocation').focus();
      return false;
    }
    if (!desc.trim()) {
      showToast('Please describe the damage.', 'error');
      document.getElementById('damageDescription').focus();
      return false;
    }

    // Check if at least one damage type is selected
    const damageTypes = document.querySelectorAll('.damage-type input:checked');
    if (damageTypes.length === 0) {
      showToast('Please select at least one damage type.', 'error');
      return false;
    }

    if (!selectedSeverity) {
      showToast('Please select the severity level.', 'error');
      return false;
    }

    return true;
  }
  if (step === 3) {
    const agreement = document.getElementById('agreementCheck').checked;
    if (!agreement) {
      showToast('Please accept the declaration to submit.', 'error');
      return false;
    }
    return true;
  }
  return true;
}

// ===== SEVERITY =====
function selectSeverity(el, level) {
  document.querySelectorAll('.severity-option').forEach(card => {
    card.classList.remove('selected');
    card.style.borderColor = '';
    const check = card.querySelector('.severity-check');
    check.innerHTML = '';
    check.style.borderColor = '#d1d5db';
    check.style.backgroundColor = 'transparent';
  });

  el.classList.add('selected');
  selectedSeverity = level;

  const colors = {
    minor: { border: '#22c55e', bg: '#22c55e' },
    moderate: { border: '#f59e0b', bg: '#f59e0b' },
    severe: { border: '#ef4444', bg: '#ef4444' }
  };

  el.style.borderColor = colors[level].border;
  const check = el.querySelector('.severity-check');
  check.style.borderColor = colors[level].bg;
  check.style.backgroundColor = colors[level].bg;
  check.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  updateReviewSummary();
}

// ===== TOGGLE SWITCH =====
function toggleSwitch(btn) {
  btn.classList.toggle('active');
  const fieldsId = btn.id === 'otherVehicleToggle' ? 'otherVehicleFields' : 'policeReportFields';
  const fields = document.getElementById(fieldsId);
  fields.classList.toggle('hidden');
}

// ===== LOCATION DISPLAY =====
function updateLocationDisplay() {
  const container = document.getElementById('selectedLocations');
  if (selectedLocations.size === 0) {
    container.innerHTML = '<span class="text-xs text-gray-400 italic">No locations selected yet</span>';
    return;
  }
  container.innerHTML = '';
  selectedLocations.forEach(loc => {
    const label = loc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const tag = document.createElement('span');
    tag.className = 'inline-flex items-center gap-1 px-2.5 py-1 bg-maroon-100 text-maroon-700 rounded-full text-xs font-medium';
    tag.innerHTML = `${label} <button type="button" onclick="removeLocation('${loc}')" class="ml-0.5 hover:text-maroon-900">&times;</button>`;
    container.appendChild(tag);
  });
}

function removeLocation(loc) {
  selectedLocations.delete(loc);
  document.querySelector(`.car-point[data-location="${loc}"]`)?.classList.remove('selected');
  updateLocationDisplay();
}

// ===== PHOTO UPLOAD =====
function handlePhotoUpload(event) {
  const files = Array.from(event.target.files);
  processFiles(files);
  event.target.value = '';
}

function processFiles(files) {
  const remaining = 5 - uploadedPhotos.length;
  if (remaining <= 0) {
    showToast('Maximum 5 photos allowed.', 'error');
    return;
  }

  const toProcess = files.slice(0, remaining);
  toProcess.forEach(file => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(`${file.name} exceeds 10MB limit.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedPhotos.push({ name: file.name, data: e.target.result });
      renderPhotoGrid();
      updateReviewSummary();
    };
    reader.readAsDataURL(file);
  });

  if (files.length > remaining) {
    showToast(`Only ${remaining} more photo(s) can be added.`, 'warning');
  }
}

function renderPhotoGrid() {
  const grid = document.getElementById('photoPreviewGrid');
  grid.innerHTML = '';

  uploadedPhotos.forEach((photo, index) => {
    const div = document.createElement('div');
    div.className = 'photo-card relative group rounded-xl overflow-hidden aspect-square bg-gray-100 border border-gray-200';
    div.innerHTML = `
      <img src="${photo.data}" alt="${photo.name}" class="w-full h-full object-cover" />
      <div class="photo-actions absolute inset-0 bg-black/40 opacity-0 transition-opacity flex items-center justify-center gap-2">
        <button type="button" onclick="removePhoto(${index})" class="w-9 h-9 rounded-full bg-white/90 text-red-600 hover:bg-white flex items-center justify-center transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p class="text-[10px] text-white truncate">${photo.name}</p>
      </div>
    `;
    grid.appendChild(div);
  });

  // Add upload placeholder if under 5
  if (uploadedPhotos.length < 5) {
    const placeholder = document.createElement('div');
    placeholder.className = 'rounded-xl overflow-hidden aspect-square bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-maroon-300 hover:bg-maroon-50/30 transition-all';
    placeholder.onclick = () => document.getElementById('photoInput').click();
    placeholder.innerHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mx-auto text-gray-300 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <p class="text-[10px] text-gray-400">Add Photo</p>
      </div>
    `;
    grid.appendChild(placeholder);
  }
}

function removePhoto(index) {
  uploadedPhotos.splice(index, 1);
  renderPhotoGrid();
  updateReviewSummary();
}

// ===== REVIEW SUMMARY =====
function updateReviewSummary() {
  // Severity
  const severityLabels = { minor: '🟢 Minor', moderate: '🟡 Moderate', severe: '🔴 Severe' };
  document.getElementById('reviewSeverity').textContent = selectedSeverity ? severityLabels[selectedSeverity] : 'Not selected';

  const nameEl = document.getElementById('reviewVehicleName');
  const plateEl = document.getElementById('reviewVehiclePlate');
  if (selectedBooking) {
    const modelLine = [selectedBooking.vehicleBrand, selectedBooking.vehicleName].filter(Boolean).join(' ');
    nameEl.textContent =
      modelLine + (selectedBooking.modelYear != null ? ` (${selectedBooking.modelYear})` : '');
    plateEl.textContent = selectedBooking.plateNumber ? `Plate: ${selectedBooking.plateNumber}` : '';
  } else {
    nameEl.textContent = '—';
    plateEl.textContent = '—';
  }

  // Damage types
  const selected = document.querySelectorAll('.damage-type input:checked');
  const labels = Array.from(selected).map((cb) => cb.id.replace(/^d/, ''));
  document.getElementById('reviewDamageTypes').textContent = labels.length > 0
    ? labels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')
    : 'None selected';

  // Photos
  document.getElementById('reviewPhotos').textContent = `${uploadedPhotos.length} uploaded`;
}

// ===== SUBMIT =====
async function handleSubmit(event) {
  event.preventDefault();
  if (!validateStep(3)) return;
  if (!selectedBooking) {
    showToast('Please select a rental in step 1.', 'error');
    return;
  }

  const damageTypes = Array.from(document.querySelectorAll('.damage-type input:checked')).map((cb) =>
    cb.id.replace(/^d/, '')
  );
  const bodyLocations = Array.from(selectedLocations);
  const photos = uploadedPhotos.map((p) => p.data);

  const payload = {
    userId: currentUserId,
    rentalBookingId: selectedBooking.bookingId,
    description: document.getElementById('damageDescription').value.trim(),
    severity: selectedSeverity,
    incidentDate: document.getElementById('incidentDate').value,
    incidentTime: document.getElementById('incidentTime').value || null,
    incidentLocation: document.getElementById('incidentLocation').value.trim(),
    damageTypes,
    bodyLocations,
    photos,
    estimatedCost: 0
  };

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  try {
    const res = await fetch(DAMAGE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Request failed (${res.status})`);
    }
    const data = await res.json();
    document.getElementById('reportRef').textContent = `DMG-${data.id}`;
    const modal = document.getElementById('successModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  } catch (e) {
    console.error(e);
    showToast(String(e.message || e).slice(0, 220), 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

function closeModal() {
  const modal = document.getElementById('successModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  const colors = {
    info: 'bg-blue-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
    success: 'bg-green-600'
  };

  const icons = {
    info: 'info',
    error: 'alert-circle',
    warning: 'alert-triangle',
    success: 'check-circle-2'
  };

  toast.className = `toast-message flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${colors[type]} min-w-[280px]`;
  toast.innerHTML = `
    <i data-lucide="${icons[type]}" class="w-4 h-4 flex-shrink-0"></i>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 opacity-70 hover:opacity-100 transition-opacity">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  container.appendChild(toast);
  lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
