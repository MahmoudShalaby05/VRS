(function () {
    const MAX_RENTAL_DAYS = 365 * 3;
    const SERVICE_FEE = 15;
    const TAX_RATE = 0.08;

    const PLAN_DISCOUNTS = { DAILY: 0, WEEKLY: 11, MONTHLY: 27, YEARLY: 42 };

    let selectedDuration = 'weekly';
    let selectedPaymentMethod = 'cash';
    let uploadedFile = null;
    let loadedVehicle = null;
    let pricePerDay = 0;

    function formatDate(d) {
        return d.toISOString().split('T')[0];
    }

    function pad2(n) {
        return String(n).padStart(2, '0');
    }

    function formatYMDLocal(d) {
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    function parseYMD(s) {
        const [y, m, da] = s.split('-').map(Number);
        return new Date(y, m - 1, da);
    }

    function addDaysLocal(d, n) {
        const x = new Date(d.getTime());
        x.setDate(x.getDate() + n);
        return x;
    }

    function rentalDaysBetween(pickupStr, returnStr) {
        const a = parseYMD(pickupStr);
        const b = parseYMD(returnStr);
        return Math.round((b - a) / (1000 * 60 * 60 * 24));
    }

    function addCalendarMonths(date, months) {
        const d = new Date(date.getTime());
        const day = d.getDate();
        d.setMonth(d.getMonth() + months);
        if (d.getDate() < day) d.setDate(0);
        return d;
    }

    function addOneYear(date) {
        const d = new Date(date.getTime());
        d.setFullYear(d.getFullYear() + 1);
        return d;
    }

    /** First full package boundary from pickup (matches server: weekly +7d, monthly +1 calendar month, yearly +1 year). */
    function firstPackageEndDate(pickupDate, planKey) {
        const pk = String(planKey).toLowerCase();
        if (pk === 'weekly') return addDaysLocal(pickupDate, 7);
        if (pk === 'monthly') return addCalendarMonths(pickupDate, 1);
        if (pk === 'yearly') return addOneYear(pickupDate);
        return addDaysLocal(pickupDate, 1);
    }

    function minReturnYmd(pickupStr, planKey) {
        const pk = String(planKey).toLowerCase();
        if (!pickupStr) return '';
        const pu = parseYMD(pickupStr);
        if (pk === 'daily') return formatYMDLocal(addDaysLocal(pu, 1));
        return formatYMDLocal(firstPackageEndDate(pu, pk));
    }

    /** On plan change: snap to one full period. On pickup change: only raise return if it became invalid. */
    function applyDefaultReturnForPlan(forceSnapToFirstPeriod) {
        const pickupEl = document.getElementById('pickupDate');
        const returnEl = document.getElementById('returnDate');
        if (!pickupEl || !returnEl || !pickupEl.value) return;
        const pu = pickupEl.value;
        const pk = selectedDuration;
        if (pk === 'daily') {
            const minR = formatYMDLocal(addDaysLocal(parseYMD(pu), 1));
            if (forceSnapToFirstPeriod || !returnEl.value || returnEl.value < minR) returnEl.value = minR;
            return;
        }
        const target = formatYMDLocal(firstPackageEndDate(parseYMD(pu), pk));
        if (forceSnapToFirstPeriod) {
            returnEl.value = target;
        } else if (!returnEl.value || returnEl.value < target) {
            returnEl.value = target;
        }
    }

    function computeSubtotalSegments(pickupStr, returnStr, planKey, pd) {
        const planU = String(planKey || 'daily').toUpperCase();
        const days = rentalDaysBetween(pickupStr, returnStr);
        if (days < 1 || pd <= 0) return 0;
        if (planU === 'DAILY') return Math.round(days * pd * 100) / 100;
        const disc = (PLAN_DISCOUNTS[planU] ?? 0) / 100;
        let pos = parseYMD(pickupStr);
        const end = parseYMD(returnStr);
        let sub = 0;
        while (pos < end) {
            let boundary;
            if (planU === 'WEEKLY') boundary = addDaysLocal(pos, 7);
            else if (planU === 'MONTHLY') boundary = addCalendarMonths(pos, 1);
            else if (planU === 'YEARLY') boundary = addOneYear(pos);
            else boundary = addDaysLocal(pos, 1);
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

    function computePriceFromDates(pickupStr, returnStr, planKey, pd) {
        const days = rentalDaysBetween(pickupStr, returnStr);
        const subtotal = days > 0 ? computeSubtotalSegments(pickupStr, returnStr, planKey, pd) : 0;
        const insurance = Math.round(Math.min(10 * days, 700) * 100) / 100;
        const serviceFee = SERVICE_FEE;
        const tax = Math.round((subtotal + insurance + serviceFee) * TAX_RATE * 100) / 100;
        const total = Math.round((subtotal + insurance + serviceFee + tax) * 100) / 100;
        const disc = PLAN_DISCOUNTS[String(planKey || 'daily').toUpperCase()] ?? 0;
        return { subtotal, insurance, serviceFee, tax, total, disc };
    }

    function discountPercent(planKey) {
        return PLAN_DISCOUNTS[String(planKey || 'daily').toUpperCase()] ?? 0;
    }

    function money(n) {
        return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function pillLabelAmount(planKey, pd) {
        const d = String(planKey).toLowerCase();
        if (d === 'daily') return { amount: pd, suffix: '/day' };
        if (d === 'weekly') return { amount: Math.round(7 * pd * (1 - PLAN_DISCOUNTS.WEEKLY / 100) * 100) / 100, suffix: '/week' };
        if (d === 'monthly') return { amount: Math.round(30 * pd * (1 - PLAN_DISCOUNTS.MONTHLY / 100) * 100) / 100, suffix: '/month' };
        if (d === 'yearly') return { amount: Math.round(365 * pd * (1 - PLAN_DISCOUNTS.YEARLY / 100) * 100) / 100, suffix: '/year' };
        return { amount: pd, suffix: '/day' };
    }

    function updateDurationPills() {
        document.querySelectorAll('.duration-pill').forEach((pill) => {
            const type = pill.dataset.type;
            const { amount, suffix } = pillLabelAmount(type, pricePerDay || 0);
            const priceEl = pill.querySelector('.pill-price');
            if (priceEl) priceEl.textContent = `$${amount.toLocaleString()}`;
            const suf = pill.querySelector('.pill-suffix');
            if (suf) {
                const labels = { daily: 'per day', weekly: 'per week', monthly: 'per month', yearly: 'per year' };
                suf.textContent = labels[type] || 'per day';
            }

            const save = pill.querySelector('.pill-save');
            const disc = discountPercent(type);
            if (save) {
                if (disc > 0) {
                    save.classList.remove('hidden');
                    save.textContent = `SAVE ${disc}%`;
                } else {
                    save.classList.add('hidden');
                }
            }
        });
    }

    window.selectDuration = function (el) {
        document.querySelectorAll('.duration-pill').forEach((pill) => {
            pill.classList.remove('active', 'border-darkRed', 'bg-darkRed/5');
            pill.classList.add('border-gray-200');
        });
        el.classList.add('active', 'border-darkRed', 'bg-darkRed/5');
        el.classList.remove('border-gray-200');
        selectedDuration = el.dataset.type;
        applyDefaultReturnForPlan(true);
        updateSummary();
    };

    window.selectPayment = function (el) {
        document.querySelectorAll('.payment-card').forEach((card) => {
            card.classList.remove('selected');
        });
        el.classList.add('selected');
        selectedPaymentMethod = el.dataset.method;

        const visaForm = document.getElementById('visaForm');
        const cashInfo = document.getElementById('cashInfo');

        if (selectedPaymentMethod === 'visa') {
            visaForm.classList.remove('hidden');
            cashInfo.classList.add('hidden');
        } else {
            visaForm.classList.add('hidden');
            cashInfo.classList.remove('hidden');
        }

        updateSummary();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.selectIDType = function (el) {
        document.querySelectorAll('.id-toggle').forEach((btn) => {
            btn.classList.remove('border-darkRed', 'bg-darkRed/5', 'text-darkRed');
            btn.classList.add('border-gray-200', 'bg-white', 'text-gray-500');
        });
        el.classList.remove('border-gray-200', 'bg-white', 'text-gray-500');
        el.classList.add('border-darkRed', 'bg-darkRed/5', 'text-darkRed');

        const type = el.dataset.type;
        const label = document.getElementById('idLabel');
        const input = document.getElementById('idNumber');
        const hint = document.getElementById('idHint');

        if (type === 'national') {
            label.textContent = 'National ID Number';
            input.placeholder = 'Enter your National ID number';
            hint.textContent = 'Your national identification number as shown on your ID card';
        } else {
            label.textContent = 'Passport Number';
            input.placeholder = 'Enter your Passport number';
            hint.textContent = 'Your passport number as shown on your passport document';
        }
    };

    window.handleFileUpload = function (event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be under 5MB', 'error');
            return;
        }

        uploadedFile = file;
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('uploadPlaceholder').classList.add('hidden');
        document.getElementById('uploadPreview').classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        showToast('License uploaded successfully!', 'success');
    };

    window.removeFile = function () {
        uploadedFile = null;
        document.getElementById('licenseFile').value = '';
        document.getElementById('uploadPlaceholder').classList.remove('hidden');
        document.getElementById('uploadPreview').classList.add('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    window.formatCardNumber = function (input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        input.value = value;
        const preview = document.getElementById('cardPreview');
        preview.textContent = value || '•••• •••• •••• ••••';
    };

    window.formatExpiry = function (input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }
        input.value = value;
        const preview = document.getElementById('expiryPreview');
        preview.textContent = value || 'MM/YY';
    };

    window.formatCvvDigits = function (input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 4);
    };

    function syncDateConstraints() {
        const pickupEl = document.getElementById('pickupDate');
        const returnEl = document.getElementById('returnDate');
        if (!pickupEl || !returnEl) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatYMDLocal(today);
        pickupEl.min = todayStr;
        if (pickupEl.value && pickupEl.value < todayStr) pickupEl.value = todayStr;

        if (pickupEl.value) {
            const minRet = minReturnYmd(pickupEl.value, selectedDuration);
            returnEl.min = minRet;
            if (returnEl.value && returnEl.value < minRet) {
                returnEl.value = minRet;
            }
        } else {
            returnEl.min = formatYMDLocal(addDaysLocal(today, 1));
        }

        const pickup = pickupEl.value;
        const ret = returnEl.value;
        if (pickup && ret) {
            const days = rentalDaysBetween(pickup, ret);
            if (days > MAX_RENTAL_DAYS) {
                showToast(`Rental cannot exceed ${MAX_RENTAL_DAYS} days (3 years).`, 'error');
                returnEl.value = formatYMDLocal(addDaysLocal(parseYMD(pickup), MAX_RENTAL_DAYS));
            }
        }
    }

    function updateSummary() {
        const durationLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
        const rateSuffix = { daily: '/day', weekly: '/week', monthly: '/month', yearly: '/year' };

        const pickup = document.getElementById('pickupDate').value;
        const returnVal = document.getElementById('returnDate').value;
        const days = pickup && returnVal ? rentalDaysBetween(pickup, returnVal) : 0;

        const { amount: pillAmount, suffix: pillSuffix } = pillLabelAmount(selectedDuration, pricePerDay || 0);

        let subtotal = 0;
        let insurance = 0;
        let tax = 0;
        let total = 0;
        if (days > 0 && pricePerDay > 0) {
            const b = computePriceFromDates(pickup, returnVal, selectedDuration, pricePerDay);
            subtotal = b.subtotal;
            insurance = b.insurance;
            tax = b.tax;
            total = b.total;
        }

        document.getElementById('summaryDuration').textContent = durationLabels[selectedDuration] || 'Weekly';
        document.getElementById('summaryRate').textContent = `$${pillAmount.toLocaleString()}${pillSuffix}`;
        document.getElementById('summarySubtotal').textContent = money(subtotal);
        document.getElementById('summaryInsurance').textContent = money(insurance);
        const sf = document.getElementById('summaryServiceFee');
        if (sf) sf.textContent = money(SERVICE_FEE);
        document.getElementById('summaryTax').textContent = money(tax);
        document.getElementById('summaryTotal').textContent = money(total);

        const durationInfo = document.getElementById('durationInfo');
        durationInfo.textContent = `${durationLabels[selectedDuration]} plan: each full week/month/year at the package discount; days beyond complete periods are billed at the daily rate ($${(pricePerDay || 0).toLocaleString()}/day).`;

        const paymentLabel = selectedPaymentMethod === 'cash' ? 'Cash' : 'Visa / Card';
        document.getElementById('summaryPayment').textContent = paymentLabel;

        const depositNote = document.getElementById('depositNote');
        if (selectedPaymentMethod === 'cash') {
            depositNote.textContent = '+$200 refundable deposit required at pickup';
            depositNote.parentElement.classList.remove('hidden');
        } else {
            depositNote.parentElement.classList.add('hidden');
        }

        if (pickup && returnVal && days > 0) {
            let periodText = '';
            if (selectedDuration === 'daily') periodText = `${days} day${days > 1 ? 's' : ''}`;
            else if (selectedDuration === 'weekly') {
                const weeks = Math.ceil(days / 7);
                periodText = `${weeks} week${weeks > 1 ? 's' : ''} (${days} days)`;
            } else if (selectedDuration === 'monthly') {
                const months = Math.ceil(days / 30);
                periodText = `${months} month${months > 1 ? 's' : ''} (${days} days)`;
            } else {
                const years = Math.ceil(days / 365);
                periodText = `${years} year${years > 1 ? 's' : ''} (${days} days)`;
            }
            document.getElementById('summaryPeriod').textContent = periodText;
        } else {
            document.getElementById('summaryPeriod').textContent = '—';
        }
    }

    window.updateSummary = function () {
        syncDateConstraints();
        updateSummary();
    };

    function getSessionUser() {
        try {
            const raw = localStorage.getItem('driveRedUserSession');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    window.handleCheckout = async function () {
        const session = getSessionUser();
        if (!session || !session.id) {
            showToast('Please log in to complete your booking.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html?next=' + encodeURIComponent(window.location.href);
            }, 1200);
            return;
        }

        if (!loadedVehicle || !loadedVehicle.bookable) {
            showToast('This vehicle cannot be booked.', 'error');
            return;
        }

        const idNumber = document.getElementById('idNumber').value.trim();
        const licenseNumber = document.getElementById('licenseNumber').value.trim();
        const licenseExpiry = document.getElementById('licenseExpiry').value;
        const pickup = document.getElementById('pickupDate').value;
        const returnVal = document.getElementById('returnDate').value;

        if (!pickup || !returnVal) {
            showToast('Please select pickup and return dates', 'error');
            return;
        }
        syncDateConstraints();
        const days = rentalDaysBetween(pickup, returnVal);
        if (days < 1) {
            showToast('Return date must be after pickup date', 'error');
            return;
        }
        if (days > MAX_RENTAL_DAYS) {
            showToast('Maximum rental is 3 years.', 'error');
            return;
        }
        const minR = minReturnYmd(pickup, selectedDuration);
        if (returnVal < minR) {
            showToast('Return date must complete at least one full package period for this plan.', 'error');
            return;
        }
        if (!idNumber) {
            showToast('Please enter your ID number', 'error');
            return;
        }
        if (!licenseNumber) {
            showToast('Please enter your driving license number', 'error');
            return;
        }
        if (!licenseExpiry) {
            showToast('Please enter your license expiry date', 'error');
            return;
        }
        if (new Date(licenseExpiry) <= new Date()) {
            showToast('Your driving license has expired!', 'error');
            return;
        }
        if (!uploadedFile) {
            showToast('Please upload your driving license', 'error');
            return;
        }
        if (selectedPaymentMethod === 'visa') {
            const cardNumber = document.getElementById('cardNumber').value.trim();
            if (cardNumber.replace(/\s/g, '').length < 16) {
                showToast('Please enter a valid card number', 'error');
                return;
            }
            const cvvEl = document.getElementById('cvvInput');
            const cvv = (cvvEl?.value || '').replace(/\D/g, '');
            if (cvv.length < 3 || cvv.length > 4) {
                showToast('Please enter a valid numeric CVV (3 or 4 digits)', 'error');
                return;
            }
        }

        const planType = String(selectedDuration || 'weekly').toUpperCase();
        const paymentMethod = selectedPaymentMethod === 'visa' ? 'Visa' : 'Cash';
        const cardDigits = document.getElementById('cardNumber')?.value.replace(/\D/g, '') || '';
        const cardLast4 = cardDigits.length >= 4 ? cardDigits.slice(-4) : null;
        const pickupCity =
            new URLSearchParams(window.location.search).get('city') ||
            loadedVehicle.city ||
            'Cairo';

        const payload = {
            userId: session.id,
            vehicleId: loadedVehicle.id,
            pickupDate: pickup,
            returnDate: returnVal,
            planType,
            paymentMethod,
            pickupCity,
            cardLast4: selectedPaymentMethod === 'visa' ? cardLast4 : null
        };

        try {
            const res = await fetch('/api/bookings/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const t = await res.text();
                throw new Error(t || `Booking failed (${res.status})`);
            }
            const booking = await res.json();

            const modal = document.getElementById('successModal');
            const content = document.getElementById('successContent');
            document.getElementById('bookingId').textContent = String(booking.id);
            document.getElementById('modalPayment').textContent = booking.paymentMethod || paymentMethod;
            document.getElementById('modalTotal').textContent = money(booking.totalAmount ?? 0);
            const mv = document.getElementById('modalVehicleName');
            if (mv) mv.textContent = `${loadedVehicle.brand} ${loadedVehicle.name}`;

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }, 50);

            createConfetti();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (err) {
            console.error(err);
            showToast(String(err.message || err).replace(/^\s*\d{3}\s*/, '').slice(0, 200) || 'Booking failed', 'error');
        }
    };

    window.closeModal = function () {
        const modal = document.getElementById('successModal');
        const content = document.getElementById('successContent');
        content.style.transform = 'scale(0.95)';
        content.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            window.location.href = 'vehicles.html';
        }, 200);
    };

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');

        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
        };
        const icons = {
            success: 'check-circle-2',
            error: 'alert-circle',
            info: 'info'
        };

        toast.className = `toast flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg ${colors[type]} max-w-sm`;
        toast.innerHTML = `
                <i data-lucide="${icons[type]}" class="w-4 h-4 flex-shrink-0"></i>
                <span class="text-sm font-medium">${message}</span>
            `;

        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function createConfetti() {
        const colors = ['#8B0000', '#B91C1C', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                    position: fixed;
                    width: ${Math.random() * 8 + 4}px;
                    height: ${Math.random() * 8 + 4}px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    top: -10px;
                    left: ${Math.random() * 100}%;
                    border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                    animation: confettiFall ${Math.random() * 2 + 2}s linear forwards;
                    z-index: 100;
                    pointer-events: none;
                `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 4000);
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        let session = null;
        try {
            const raw = localStorage.getItem('driveRedUserSession');
            session = raw ? JSON.parse(raw) : null;
        } catch (e) {
            session = null;
        }
        if (!session || !session.id) {
            window.location.replace(`login.html?next=${encodeURIComponent(window.location.href)}`);
            return;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

        const params = new URLSearchParams(window.location.search);
        const vid = Number(params.get('id'));
        const qpPickup = params.get('pickup');
        const qpReturn = params.get('return');

        try {
            if (vid) {
                loadedVehicle = await fetchVehicleById(vid);
                pricePerDay = Number(loadedVehicle.price || 0);
                if (!loadedVehicle.bookable) {
                    showToast('This vehicle is not available for online booking.', 'error');
                }
            }
        } catch (e) {
            console.error(e);
            showToast('Could not load vehicle for checkout.', 'error');
        }

        updateDurationPills();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pickupEl = document.getElementById('pickupDate');
        const returnEl = document.getElementById('returnDate');
        if (pickupEl && returnEl) {
            pickupEl.min = formatYMDLocal(today);
            returnEl.min = formatYMDLocal(addDaysLocal(today, 1));

            if (qpPickup && qpReturn) {
                pickupEl.value = qpPickup;
                returnEl.value = qpReturn;
            } else {
                const pickupDate = addDaysLocal(today, 1);
                pickupEl.value = formatYMDLocal(pickupDate);
                returnEl.value = formatYMDLocal(firstPackageEndDate(pickupDate, selectedDuration));
            }
            pickupEl.addEventListener('change', () => {
                applyDefaultReturnForPlan(false);
                window.updateSummary();
            });
            returnEl.addEventListener('change', window.updateSummary);
        }

        applyDefaultReturnForPlan(false);

        syncDateConstraints();
        window.updateSummary();

        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file) {
                    const input = document.getElementById('licenseFile');
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    window.handleFileUpload({ target: { files: [file] } });
                }
            });
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                    }
                });
            },
            { threshold: 0.1 }
        );
        document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    });
})();
