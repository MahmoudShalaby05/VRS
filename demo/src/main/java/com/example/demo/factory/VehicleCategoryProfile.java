package com.example.demo.factory;

import com.example.demo.model.Vehicle;

/**
 * Category-specific defaults used when creating a new {@link Vehicle}.
 * Each enum constant represents a concrete “vehicle type” profile for the Factory pattern.
 */
public enum VehicleCategoryProfile {

    SEDAN(5, "Auto", "Petrol", "2.0L Turbo", "2 Bags", 220, 4.5, 92, "Comfort"),
    SUV(7, "Auto", "Petrol", "3.5L V6", "4 Bags", 250, 4.6, 94, "Family"),
    VAN(8, "Auto", "Diesel", "2.2L Diesel", "5 Bags", 240, 4.4, 90, "Utility"),
    LUXURY(4, "Auto", "Petrol", "3.0L V6", "2 Bags", 200, 4.8, 97, "Premium"),
    ELECTRIC(5, "Auto", "Electric", "Electric motor", "2 Bags", 300, 4.7, 96, "EV"),
    /** Used when category is missing or does not match a known profile. */
    DEFAULT(5, "Auto", "Petrol", "2.0L", "2 Bags", 250, 4.6, 95, "Popular");

    private final int defaultSeats;
    private final String defaultTransmission;
    private final String defaultFuel;
    private final String defaultEngine;
    private final String defaultLuggage;
    private final int defaultDailyKm;
    private final double defaultRating;
    private final int defaultMatchScore;
    private final String defaultBadge;

    VehicleCategoryProfile(
            int defaultSeats,
            String defaultTransmission,
            String defaultFuel,
            String defaultEngine,
            String defaultLuggage,
            int defaultDailyKm,
            double defaultRating,
            int defaultMatchScore,
            String defaultBadge
    ) {
        this.defaultSeats = defaultSeats;
        this.defaultTransmission = defaultTransmission;
        this.defaultFuel = defaultFuel;
        this.defaultEngine = defaultEngine;
        this.defaultLuggage = defaultLuggage;
        this.defaultDailyKm = defaultDailyKm;
        this.defaultRating = defaultRating;
        this.defaultMatchScore = defaultMatchScore;
        this.defaultBadge = defaultBadge;
    }

    /**
     * Maps a free-form category string (from API / admin UI) to a profile.
     */
    public static VehicleCategoryProfile fromCategory(String category) {
        if (category == null || category.isBlank()) {
            return DEFAULT;
        }
        String u = category.trim().toUpperCase();
        if (u.contains("SUV") || u.contains("CROSSOVER")) {
            return SUV;
        }
        if (u.contains("VAN") || u.contains("MINIVAN")) {
            return VAN;
        }
        if (u.contains("LUXURY") || u.contains("PREMIUM")) {
            return LUXURY;
        }
        if (u.contains("ELECTRIC") || u.contains("BEV") || u.equals("EV")) {
            return ELECTRIC;
        }
        if (u.contains("SEDAN") || u.equals("CAR")) {
            return SEDAN;
        }
        return DEFAULT;
    }

    /**
     * Fills only <strong>null</strong> fields so a full client payload is unchanged.
     */
    public void applyMissingDefaults(Vehicle v) {
        if (v.getSeats() == null) {
            v.setSeats(defaultSeats);
        }
        if (isBlank(v.getTransmission())) {
            v.setTransmission(defaultTransmission);
        }
        if (isBlank(v.getFuel())) {
            v.setFuel(defaultFuel);
        }
        if (isBlank(v.getEngine())) {
            v.setEngine(defaultEngine);
        }
        if (isBlank(v.getLuggage())) {
            v.setLuggage(defaultLuggage);
        }
        if (v.getDailyKm() == null) {
            v.setDailyKm(defaultDailyKm);
        }
        if (v.getRating() == null) {
            v.setRating(defaultRating);
        }
        if (v.getMatchScore() == null) {
            v.setMatchScore(defaultMatchScore);
        }
        if (isBlank(v.getBadge())) {
            v.setBadge(defaultBadge);
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
