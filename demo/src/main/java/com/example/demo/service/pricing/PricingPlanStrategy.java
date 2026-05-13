package com.example.demo.service.pricing;

import java.time.LocalDate;

/**
 * Strategy for plan-specific rental pricing rules (discount on full package segments,
 * calendar boundaries, and minimum return for the first package).
 * <p>
 * Used only from {@link com.example.demo.service.BookingPricing}; behavior matches the
 * previous switch-based implementation.
 */
public enum PricingPlanStrategy {

    DAILY(0.0) {
        @Override
        public LocalDate firstPackagePeriodEnd(LocalDate pickup) {
            return pickup.plusDays(1);
        }

        @Override
        public LocalDate rawNextBoundary(LocalDate pos, LocalDate rentalEndExclusive) {
            throw new IllegalStateException("DAILY subtotal does not use segment boundaries");
        }
    },

    WEEKLY(11.0) {
        @Override
        public LocalDate firstPackagePeriodEnd(LocalDate pickup) {
            return pickup.plusWeeks(1);
        }

        @Override
        public LocalDate rawNextBoundary(LocalDate pos, LocalDate rentalEndExclusive) {
            return pos.plusWeeks(1);
        }
    },

    MONTHLY(27.0) {
        @Override
        public LocalDate firstPackagePeriodEnd(LocalDate pickup) {
            return pickup.plusMonths(1);
        }

        @Override
        public LocalDate rawNextBoundary(LocalDate pos, LocalDate rentalEndExclusive) {
            return pos.plusMonths(1);
        }
    },

    YEARLY(42.0) {
        @Override
        public LocalDate firstPackagePeriodEnd(LocalDate pickup) {
            return pickup.plusYears(1);
        }

        @Override
        public LocalDate rawNextBoundary(LocalDate pos, LocalDate rentalEndExclusive) {
            return pos.plusYears(1);
        }
    },

    /**
     * Any plan key other than DAILY/WEEKLY/MONTHLY/YEARLY: no package discount, one logical segment to rental end.
     */
    FALLBACK(0.0) {
        @Override
        public LocalDate firstPackagePeriodEnd(LocalDate pickup) {
            return pickup.plusDays(1);
        }

        @Override
        public LocalDate rawNextBoundary(LocalDate pos, LocalDate rentalEndExclusive) {
            return rentalEndExclusive;
        }
    };

    private final double packageDiscountPercent;

    PricingPlanStrategy(double packageDiscountPercent) {
        this.packageDiscountPercent = packageDiscountPercent;
    }

    /**
     * Discount percent (0–100) applied to full package segments only.
     */
    public final double packageDiscountPercent() {
        return packageDiscountPercent;
    }

    public abstract LocalDate firstPackagePeriodEnd(LocalDate pickup);

    /**
     * Next segment boundary from {@code pos}; may extend past the rental end (caller clips to return date).
     */
    public abstract LocalDate rawNextBoundary(LocalDate pos, LocalDate rentalEndExclusive);

    public static PricingPlanStrategy fromNormalizedPlan(String normalizedPlan) {
        if (normalizedPlan == null || normalizedPlan.isBlank()) {
            return DAILY;
        }
        return switch (normalizedPlan.trim().toUpperCase()) {
            case "DAILY" -> DAILY;
            case "WEEKLY" -> WEEKLY;
            case "MONTHLY" -> MONTHLY;
            case "YEARLY" -> YEARLY;
            default -> FALLBACK;
        };
    }
}
