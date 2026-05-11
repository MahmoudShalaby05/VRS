document.addEventListener("DOMContentLoaded", () => {
    initPage();
});

async function initPage() {
    const params = new URLSearchParams(window.location.search);
    const carId = Number(params.get("id"));
    let car = null;

    try {
        if (carId) {
            car = await fetchVehicleById(carId);
        }
    } catch (error) {
        console.error("Could not load vehicle details by ID:", error);
    }

    if (!car) {
        try {
            const allCars = await fetchVehicles();
            car = allCars[0] || null;
        } catch (error) {
            console.error("Could not load fallback vehicle list:", error);
        }
    }

    if (!car) {
        return;
    }

    populateDetails(car);
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function populateDetails(car) {
    document.getElementById("carName").textContent = car.name;
    document.getElementById("carTypeBadge").textContent = car.type;
    document.getElementById("carTagline").textContent = `${car.city} • ${car.modelYear} • Rated ${car.rating}/5`;
    document.getElementById("carDescription").textContent = car.description;
    document.getElementById("carPrice").textContent = `$${car.price} / day`;
    document.getElementById("heroImage").src = car.img;
    document.getElementById("heroImage").alt = car.name;

    const reserveBtn = document.getElementById("reserveCarBtn");
    if (reserveBtn) {
        reserveBtn.href = `checkout.html?id=${encodeURIComponent(car.id)}`;
    }

    const specGrid = document.getElementById("specGrid");
    const specs = [
        { label: "Category", value: car.category.toUpperCase() },
        { label: "Model year", value: `${car.modelYear}` },
        { label: "Seats", value: `${car.seats} seats` },
        { label: "Transmission", value: car.transmission },
        { label: "Fuel", value: car.fuel },
        { label: "Engine", value: car.engine },
        { label: "Drive", value: car.drive },
        { label: "Luggage", value: car.luggage },
        { label: "Daily allowance", value: `${car.dailyKm} km/day` }
    ];

    specGrid.innerHTML = specs
        .map((spec) => `<div class="spec-item"><p>${spec.label}</p><p>${spec.value}</p></div>`)
        .join("");

    const egyptReasons = document.getElementById("egyptReasons");
    egyptReasons.innerHTML = `
        <p><strong>Built for local roads:</strong> This ${car.type.toLowerCase()} balances comfort with performance for daily city traffic and highway trips.</p>
        <p><strong>Smart for Egyptian weather:</strong> Strong A/C performance and stable ride quality for hot summer days and long-distance travel.</p>
        <p><strong>Practical rental value:</strong> ${car.dailyKm} km daily allowance with a category that fits both personal and business needs.</p>
    `;
}
