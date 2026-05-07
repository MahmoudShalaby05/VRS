(function () {
    let selectedDuration = 'weekly';
    let selectedPrice = 280;
    let selectedPaymentMethod = 'cash';
    let uploadedFile = null;

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    window.selectDuration = function (el) {
        document.querySelectorAll('.duration-pill').forEach((pill) => {
            pill.classList.remove('active');
        });
        el.classList.add('active');
        selectedDuration = el.dataset.type;
        selectedPrice = parseInt(el.dataset.price, 10);
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

    function updateSummary() {
        const durationLabels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
        const rateLabels = { daily: '/day', weekly: '/week', monthly: '/month', yearly: '/year' };
        const insuranceRates = { daily: 10, weekly: 25, monthly: 80, yearly: 700 };

        const subtotal = selectedPrice;
        const insurance = insuranceRates[selectedDuration];
        const serviceFee = 15;
        const tax = (subtotal + insurance + serviceFee) * 0.08;
        const total = subtotal + insurance + serviceFee + tax;

        document.getElementById('summaryDuration').textContent = durationLabels[selectedDuration];
        document.getElementById('summaryRate').textContent = `$${selectedPrice.toLocaleString()}${rateLabels[selectedDuration]}`;
        document.getElementById('summarySubtotal').textContent = `$${subtotal.toLocaleString()}.00`;
        document.getElementById('summaryInsurance').textContent = `$${insurance}.00`;
        document.getElementById('summaryTax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;

        const durationInfo = document.getElementById('durationInfo');
        durationInfo.textContent = `Selected: ${durationLabels[selectedDuration]} rental at $${selectedPrice.toLocaleString()}${rateLabels[selectedDuration]}`;

        const paymentLabel = selectedPaymentMethod === 'cash' ? 'Cash' : 'Visa / Card';
        document.getElementById('summaryPayment').textContent = paymentLabel;

        const depositNote = document.getElementById('depositNote');
        if (selectedPaymentMethod === 'cash') {
            depositNote.textContent = '+$200 refundable deposit required at pickup';
            depositNote.parentElement.classList.remove('hidden');
        } else {
            depositNote.parentElement.classList.add('hidden');
        }

        const pickup = document.getElementById('pickupDate').value;
        const returnVal = document.getElementById('returnDate').value;
        if (pickup && returnVal) {
            const diff = Math.ceil((new Date(returnVal) - new Date(pickup)) / (1000 * 60 * 60 * 24));
            if (diff > 0) {
                let periodText = '';
                if (selectedDuration === 'daily') periodText = `${diff} day${diff > 1 ? 's' : ''}`;
                else if (selectedDuration === 'weekly') {
                    const weeks = Math.ceil(diff / 7);
                    periodText = `${weeks} week${weeks > 1 ? 's' : ''}`;
                } else if (selectedDuration === 'monthly') {
                    const months = Math.ceil(diff / 30);
                    periodText = `${months} month${months > 1 ? 's' : ''}`;
                } else {
                    const years = Math.ceil(diff / 365);
                    periodText = `${years} year${years > 1 ? 's' : ''}`;
                }
                document.getElementById('summaryPeriod').textContent = periodText;
            }
        }
    }

    window.updateSummary = updateSummary;
    window.handleCheckout = function () {
        const idNumber = document.getElementById('idNumber').value.trim();
        const licenseNumber = document.getElementById('licenseNumber').value.trim();
        const licenseExpiry = document.getElementById('licenseExpiry').value;

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
        }

        const modal = document.getElementById('successModal');
        const content = document.getElementById('successContent');
        document.getElementById('bookingId').textContent = Math.floor(100000 + Math.random() * 900000);
        document.getElementById('modalPayment').textContent =
            selectedPaymentMethod === 'cash' ? 'Cash' : 'Visa / Card';
        document.getElementById('modalTotal').textContent = document.getElementById('summaryTotal').textContent;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            content.style.transform = 'scale(1)';
            content.style.opacity = '1';
        }, 50);

        createConfetti();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.closeModal = function () {
        const modal = document.getElementById('successModal');
        const content = document.getElementById('successContent');
        content.style.transform = 'scale(0.95)';
        content.style.opacity = '0';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
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

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const today = new Date();
        const pickupDate = new Date(today);
        pickupDate.setDate(today.getDate() + 1);
        const returnDate = new Date(today);
        returnDate.setDate(today.getDate() + 8);

        const pickupEl = document.getElementById('pickupDate');
        const returnEl = document.getElementById('returnDate');
        if (pickupEl && returnEl) {
            pickupEl.value = formatDate(pickupDate);
            returnEl.value = formatDate(returnDate);
            pickupEl.min = formatDate(today);
        }

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

        updateSummary();
    });
})();
