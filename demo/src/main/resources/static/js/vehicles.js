const compareList = new Set();
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let currentCarsList = [];
let CARS_DATA = [];

document.addEventListener("DOMContentLoaded", async () => {
    try {
        CARS_DATA = await fetchVehicles();
    } catch (error) {
        console.error("Could not load vehicles from database:", error);
        CARS_DATA = [];
    }
    initDynamicFilters();
    wireUi();
    applyFilterAndSort();
    updateCompareUi();
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
});

function wireUi() {
    const quickFilters = document.getElementById("quickFilters");
    const sortBy = document.getElementById("sortBy");
    const filtersDrawer = document.getElementById("filtersDrawer");

    if (quickFilters) {
        quickFilters.addEventListener("click", (event) => {
            const btn = event.target.closest(".chip");
            if (!btn) return;
            quickFilters.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"));
            btn.classList.add("active");
            applyFilterAndSort();
        });
    }

    if (sortBy) {
        sortBy.addEventListener("change", applyFilterAndSort);
    }

    document.getElementById("carSearchInput")?.addEventListener("input", applyFilterAndSort);
    document.getElementById("brandFilter")?.addEventListener("change", applyFilterAndSort);

    const priceRange = document.getElementById("priceRange");
    const maxPriceLabel = document.getElementById("maxPriceLabel");
    if (priceRange && maxPriceLabel) {
        priceRange.addEventListener("input", () => {
            maxPriceLabel.textContent = `$${priceRange.value}`;
        });
    }

    const modelYearRange = document.getElementById("modelYearRange");
    const modelYearLabel = document.getElementById("modelYearLabel");
    if (modelYearRange && modelYearLabel) {
        modelYearRange.addEventListener("input", () => {
            modelYearLabel.textContent = modelYearRange.value;
            applyFilterAndSort();
        });
    }

    document.getElementById("toggleFiltersBtn")?.addEventListener("click", () => {
        filtersDrawer?.classList.remove("hidden");
    });
    document.getElementById("closeFiltersBtn")?.addEventListener("click", () => {
        filtersDrawer?.classList.add("hidden");
    });
    document.getElementById("applyFiltersBtn")?.addEventListener("click", () => {
        filtersDrawer?.classList.add("hidden");
        applyFilterAndSort();
    });

    document.getElementById("clearCompareBtn")?.addEventListener("click", () => {
        compareList.clear();
        updateCompareUi();
        renderCars(currentCarsList);
    });

    document.getElementById("compareNowBtn")?.addEventListener("click", () => {
        openCompareModal();
    });
    document.getElementById("closeCompareModalBtn")?.addEventListener("click", closeCompareModal);
    document.querySelector(".compare-modal-backdrop")?.addEventListener("click", closeCompareModal);
}

function getCurrentCars() {
    const activeFilter = document.querySelector(".chip.active")?.dataset.filter || "all";
    let filtered = [...CARS_DATA];
    if (activeFilter !== "all") filtered = filtered.filter((car) => car.category === activeFilter);

    const maxPrice = Number(document.getElementById("priceRange")?.value || "330");
    filtered = filtered.filter((car) => car.price <= maxPrice);

    const searchQuery = document.getElementById("carSearchInput")?.value?.trim().toLowerCase() || "";
    if (searchQuery) {
        filtered = filtered.filter((car) =>
            `${car.name} ${car.brand} ${car.city} ${car.type}`.toLowerCase().includes(searchQuery)
        );
    }

    const selectedBrand = document.getElementById("brandFilter")?.value || "all";
    if (selectedBrand !== "all") {
        filtered = filtered.filter((car) => car.brand.toLowerCase() === selectedBrand.toLowerCase());
    }

    const maxModelYear = Number(document.getElementById("modelYearRange")?.value || "9999");
    filtered = filtered.filter((car) => car.modelYear <= maxModelYear);

    const automaticChecked = document.getElementById("automaticFilter")?.checked;
    const manualChecked = document.getElementById("manualFilter")?.checked;
    if (automaticChecked && !manualChecked) {
        filtered = filtered.filter((car) => car.transmission === "Automatic");
    } else if (manualChecked && !automaticChecked) {
        filtered = filtered.filter((car) => car.transmission === "Manual");
    }

    const selectedFuels = Array.from(document.querySelectorAll(".fuel-filter:checked")).map((el) => el.value);
    if (selectedFuels.length > 0) {
        filtered = filtered.filter((car) => selectedFuels.includes(car.fuel));
    }

    return filtered;
}

function applyFilterAndSort(resetPage = true) {
    const sortBy = document.getElementById("sortBy")?.value || "recommended";
    const activeCars = getCurrentCars();

    if (sortBy === "price-low") activeCars.sort((a, b) => a.price - b.price);
    if (sortBy === "rating") activeCars.sort((a, b) => b.rating - a.rating);
    if (sortBy === "recommended") activeCars.sort((a, b) => b.match - a.match);

    currentCarsList = activeCars;
    if (resetPage) currentPage = 1;
    renderCars(currentCarsList);
}

function renderCars(list) {
    const carsGrid = document.getElementById("carsGrid");
    const resultsCount = document.getElementById("resultsCount");
    const pagination = document.getElementById("pagination");
    if (!carsGrid) return;

    const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pagedCars = list.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    const endIndex = list.length === 0 ? 0 : Math.min(startIndex + ITEMS_PER_PAGE, list.length);

    resultsCount.textContent = list.length === 0
        ? "No cars found. Try changing filters."
        : `Showing ${startIndex + 1}-${endIndex} of ${list.length} cars`;
    carsGrid.innerHTML = pagedCars
        .map((car) => {
            const compared = compareList.has(car.id);
            const unavailable = !car.bookable;
            const statusLower = (car.availabilityStatus || "").toLowerCase();
            const badgeClass =
                statusLower === "maintenance" ? "availability-badge maintenance" : "availability-badge booked";
            const badgeLabel =
                statusLower === "maintenance" ? "Maintenance" : statusLower === "booked" ? "Booked" : "Unavailable";
            const badgeHtml = unavailable
                ? `<span class="${badgeClass}">${badgeLabel}</span>`
                : "";
            return `
            <article class="car-card${unavailable ? " is-unavailable" : ""}">
                <div class="car-media relative">
                    <img src="${car.img}" alt="${car.name}" class="car-thumb">
                    <div class="tag-row">
                        <span class="tag red">${car.badges[0]}</span>
                        <span class="tag light">${car.match}% match</span>
                        ${badgeHtml}
                    </div>
                </div>
                <div class="car-main">
                    <div class="car-main-top">
                        <h3 class="font-bold text-2xl">${car.name}</h3>
                        <p class="text-gray-500 text-sm">${car.brand} • ${car.type} • ${car.modelYear} • ${car.city}</p>
                    </div>
                    <ul class="spec-list">
                        <li><span>Seats</span><strong>${car.seats}</strong></li>
                        <li><span>Transmission</span><strong>${car.transmission}</strong></li>
                        <li><span>Fuel</span><strong>${car.fuel}</strong></li>
                        <li><span>Luggage</span><strong>${car.luggage}</strong></li>
                        <li><span>Engine</span><strong>${car.engine}</strong></li>
                    </ul>
                </div>
                <div class="car-actions-panel">
                    <div class="text-right">
                        <p class="font-black text-darkRed text-3xl">$${car.price}</p>
                        <p class="text-gray-400 text-xs">per day</p>
                    </div>
                    <div class="card-actions">
                        <button class="view-btn" onclick="openCarDetails(${car.id})">View details</button>
                        <button data-car-id="${car.id}" class="compare-add-btn ${compared ? "active" : ""}">
                            ${compared ? "Added" : "Compare"}
                        </button>
                    </div>
                </div>
            </article>`;
        })
        .join("");

    carsGrid.querySelectorAll(".compare-add-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = Number(btn.getAttribute("data-car-id"));
            if (compareList.has(id)) {
                compareList.delete(id);
            } else if (compareList.size < 3) {
                compareList.add(id);
            }
            updateCompareUi();
            renderCars(list);
        });
    });

    if (pagination) {
        pagination.innerHTML = buildPaginationMarkup(totalPages);
        pagination.querySelectorAll("[data-page]").forEach((btn) => {
            btn.addEventListener("click", () => {
                currentPage = Number(btn.getAttribute("data-page"));
                renderCars(currentCarsList);
            });
        });
    }
}

function updateCompareUi() {
    const compareCount = document.getElementById("compareCount");
    if (compareCount) compareCount.textContent = `(${compareList.size}/3)`;
    const compareNowBtn = document.getElementById("compareNowBtn");
    if (compareNowBtn) compareNowBtn.disabled = compareList.size < 2;
}

function openCarDetails(carId) {
    window.location.href = `/car-details.html?id=${carId}`;
}

function openCompareModal() {
    const compareModal = document.getElementById("compareModal");
    const compareContent = document.getElementById("compareContent");
    const selectedCars = CARS_DATA.filter((car) => compareList.has(car.id));
    if (!compareModal || !compareContent || selectedCars.length < 2) return;

    compareContent.innerHTML = `
        <div class="compare-cards-wrap">
            ${selectedCars.map((car) => `
                <article class="compare-car-card">
                    <div class="compare-car-image-shell">
                        <img src="${car.img}" alt="${car.name}" class="compare-car-image">
                        <span class="compare-badge">${car.badges[0]}</span>
                    </div>
                    <div class="compare-car-body">
                        <div class="compare-title-row">
                            <h4>${car.name}</h4>
                            <p>$${car.price}<span>/day</span></p>
                        </div>
                        <p class="compare-subtitle">${car.brand} • ${car.type} • ${car.modelYear}</p>
                        <ul class="compare-specs">
                            <li><span>Seats</span><strong>${car.seats}</strong></li>
                            <li><span>Transmission</span><strong>${car.transmission}</strong></li>
                            <li><span>Fuel</span><strong>${car.fuel}</strong></li>
                            <li><span>Engine</span><strong>${car.engine}</strong></li>
                            <li><span>City</span><strong>${car.city}</strong></li>
                            <li><span>Rating</span><strong>${car.rating}/5</strong></li>
                            <li><span>Luggage</span><strong>${car.luggage}</strong></li>
                        </ul>
                    </div>
                </article>
            `).join("")}
        </div>
    `;
    compareModal.classList.remove("hidden");
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function closeCompareModal() {
    document.getElementById("compareModal")?.classList.add("hidden");
}

function buildPaginationMarkup(totalPages) {
    if (totalPages <= 1) return "";
    const pages = getVisiblePages(totalPages, currentPage);
    const pageButtons = pages
        .map((page) =>
            page === "..."
                ? `<span class="pagination-ellipsis">...</span>`
                : `<button class="pagination-btn ${page === currentPage ? "active" : ""}" data-page="${page}">${page}</button>`
        )
        .join("");

    return `
        <button class="pagination-btn" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? "disabled" : ""}>Prev</button>
        ${pageButtons}
        <button class="pagination-btn" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
    `;
}

function getVisiblePages(totalPages, page) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (page >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
}

function initDynamicFilters() {
    const brandFilter = document.getElementById("brandFilter");
    const modelYearRange = document.getElementById("modelYearRange");
    const modelYearLabel = document.getElementById("modelYearLabel");
    if (!brandFilter || !modelYearRange || !modelYearLabel) return;

    const brands = [...new Set(CARS_DATA.map((car) => car.brand))].sort((a, b) => a.localeCompare(b));
    brandFilter.innerHTML = `<option value="all">All brands</option>${brands
        .map((brand) => `<option value="${brand.toLowerCase()}">${brand}</option>`)
        .join("")}`;

    const years = CARS_DATA.map((car) => car.modelYear);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    modelYearRange.min = String(minYear);
    modelYearRange.max = String(maxYear);
    modelYearRange.value = String(maxYear);
    modelYearLabel.textContent = String(maxYear);
}
