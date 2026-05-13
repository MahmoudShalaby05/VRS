package com.example.demo.factory;

import com.example.demo.model.Vehicle;
import com.example.demo.state.VehicleAvailability;
import org.springframework.stereotype.Component;

/**
 * Factory for assembling a {@link Vehicle} ready to persist.
 * Chooses a {@link VehicleCategoryProfile} from the requested category and applies type-specific defaults
 * only where the client did not supply a value (null / blank).
 */
@Component
public class VehicleFactory {

    /**
     * Prepares a new vehicle entity before insert: availability default + category-based defaults for missing fields.
     * Does not modify non-null fields from the request body.
     */
    public Vehicle prepareNewVehicle(Vehicle fromRequest) {
        if (fromRequest == null) {
            throw new IllegalArgumentException("Vehicle payload is required");
        }
        if (fromRequest.getAvailabilityStatus() == null || fromRequest.getAvailabilityStatus().isBlank()) {
            fromRequest.setAvailabilityStatus(VehicleAvailability.AVAILABLE.persistenceCode());
        }
        VehicleCategoryProfile profile = VehicleCategoryProfile.fromCategory(fromRequest.getCategory());
        profile.applyMissingDefaults(fromRequest);
        return fromRequest;
    }
}
