package com.example.demo.state;

import com.example.demo.model.Vehicle;

/**
 * State pattern for persisted {@link Vehicle#getAvailabilityStatus()} values.
 * Each constant encapsulates behavior (whether maintenance blocks booking, whether public checkout is blocked,
 * whether automated refresh from reservations may change the stored status). Persistence still uses the same
 * strings as before: {@code Available}, {@code Booked}, {@code Maintenance}.
 */
public enum VehicleAvailability {

    AVAILABLE("Available"),
    BOOKED("Booked"),
    MAINTENANCE("Maintenance");

    private final String persistenceCode;

    VehicleAvailability(String persistenceCode) {
        this.persistenceCode = persistenceCode;
    }

    /** Value stored in {@code vehicles.availability_status}. */
    public String persistenceCode() {
        return persistenceCode;
    }

    /**
     * Resolves a raw DB/admin string to a state. Unknown or blank values are treated as {@link #AVAILABLE},
     * matching previous non-maintenance handling for refresh and checkout guards.
     */
    public static VehicleAvailability fromDatabase(String raw) {
        if (raw == null || raw.isBlank()) {
            return AVAILABLE;
        }
        String t = raw.trim();
        if (t.equalsIgnoreCase(MAINTENANCE.persistenceCode())) {
            return MAINTENANCE;
        }
        if (t.equalsIgnoreCase(BOOKED.persistenceCode())) {
            return BOOKED;
        }
        if (t.equalsIgnoreCase(AVAILABLE.persistenceCode())) {
            return AVAILABLE;
        }
        return AVAILABLE;
    }

    public boolean isMaintenance() {
        return this == MAINTENANCE;
    }

    /** Customer online checkout is blocked when the fleet row is in the booked state. */
    public boolean blocksPublicOnlineBooking() {
        return this == BOOKED;
    }

    /**
     * Maintenance is a manual/admin state: automated reservation-based refresh must not overwrite it.
     */
    public boolean locksAutomatedAvailabilityRefresh() {
        return this == MAINTENANCE;
    }

    /**
     * Updates {@code vehicle} to {@link #BOOKED} or {@link #AVAILABLE} from active reservation count,
     * unless the current state {@link #locksAutomatedAvailabilityRefresh()}.
     */
    public static void refreshFromActiveReservationCount(Vehicle vehicle, long activeReservationCount) {
        VehicleAvailability current = fromDatabase(vehicle.getAvailabilityStatus());
        if (current.locksAutomatedAvailabilityRefresh()) {
            return;
        }
        VehicleAvailability next = activeReservationCount > 0 ? BOOKED : AVAILABLE;
        vehicle.setAvailabilityStatus(next.persistenceCode());
    }
}
