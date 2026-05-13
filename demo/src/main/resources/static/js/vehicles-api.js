async function fetchVehicles() {
    const response = await fetch("/api/vehicles");
    if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.status}`);
    }
    const rawVehicles = await response.json();
    return rawVehicles.map(mapVehicleFromApi);
}

async function fetchVehicleById(id) {
    const response = await fetch(`/api/vehicles/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch vehicle ${id}: ${response.status}`);
    }
    const rawVehicle = await response.json();
    return mapVehicleFromApi(rawVehicle);
}

function mapVehicleFromApi(vehicle) {
    const rawCategory = (vehicle.category || "sedan").toLowerCase();
    const category = (rawCategory === "performance" || rawCategory === "sport" || rawCategory === "sports")
        ? "sports"
        : rawCategory;
    const typeMap = {
        sedan: "Sedan",
        suv: "SUV",
        hatchback: "Hatchback",
        luxury: "Luxury",
        electric: "Electric",
        hybrid: "Hybrid",
        sports: "Sports"
    };

    const primaryBadge = vehicle.badge === "Performance"
        ? "Sports"
        : (vehicle.badge || "Popular");

    const availabilityRaw = (vehicle.availabilityStatus || "Available").trim();
    const availabilityLower = availabilityRaw.toLowerCase();
    const bookable = availabilityLower !== "maintenance" && availabilityLower !== "booked";

    return {
        id: vehicle.id,
        name: vehicle.name,
        brand: vehicle.brand,
        category,
        type: typeMap[category] || "Sedan",
        modelYear: vehicle.modelYear,
        city: vehicle.city || "Cairo",
        seats: vehicle.seats ?? 5,
        transmission: vehicle.transmission || "Automatic",
        fuel: vehicle.fuel || "Petrol",
        engine: vehicle.engine || "1.6L",
        luggage: vehicle.luggage || "3 bags",
        dailyKm: vehicle.dailyKm ?? 220,
        price: vehicle.pricePerDay ?? 0,
        rating: vehicle.rating ?? 4.5,
        match: vehicle.matchScore ?? 90,
        badges: [primaryBadge],
        img: vehicle.imageUrl || "http://static.photos/automotive/640x360/1",
        description: vehicle.description || "Vehicle details are available.",
        availabilityStatus: availabilityRaw,
        bookable
    };
}
