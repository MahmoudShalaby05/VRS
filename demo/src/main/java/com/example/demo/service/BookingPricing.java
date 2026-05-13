package com.example.demo.service;

import com.example.demo.service.pricing.PricingPlanStrategy;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class BookingPricing {

    public static final int MAX_RENTAL_DAYS = 365 * 3;
    private static final double SERVICE_FEE = 15.0;
    private static final double TAX_RATE = 0.08;

    private BookingPricing() {
    }

    public static int rentalDays(LocalDate pickup, LocalDate returnDate) {
        long days = ChronoUnit.DAYS.between(pickup, returnDate);
        return (int) days;
    }

    public static double discountPercentForPlan(String planType) {
        if (planType == null) {
            return 0;
        }
        return PricingPlanStrategy.fromNormalizedPlan(planType.trim().toUpperCase()).packageDiscountPercent();
    }

    public static void validateDateRange(LocalDate pickup, LocalDate returnDate) {
        if (pickup == null || returnDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup and return dates are required");
        }
        if (returnDate.isBefore(pickup) || returnDate.isEqual(pickup)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Return date must be after pickup date");
        }
        int days = rentalDays(pickup, returnDate);
        if (days < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rental must be at least one day");
        }
        if (days > MAX_RENTAL_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum rental length is 3 years");
        }
    }

    /** Customer checkout: pickup cannot be before today. */
    public static void validateDatesForCustomer(LocalDate pickup, LocalDate returnDate, LocalDate today, String planType) {
        validateDateRange(pickup, returnDate);
        if (pickup.isBefore(today)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be before today");
        }
        validateMinimumReturnForPackage(pickup, returnDate, planType);
    }

    public static String normalizePlanType(String planType) {
        if (planType == null || planType.isBlank()) {
            return "DAILY";
        }
        return planType.trim().toUpperCase();
    }

    /**
     * First calendar boundary for weekly / monthly / yearly from pickup (return date is exclusive end-of-rental).
     * Weekly = +7 days, monthly = +1 month, yearly = +1 year.
     */
    public static LocalDate firstPackagePeriodEnd(LocalDate pickup, String planType) {
        String p = normalizePlanType(planType);
        return PricingPlanStrategy.fromNormalizedPlan(p).firstPackagePeriodEnd(pickup);
    }

    /**
     * For weekly/monthly/yearly, return must complete at least one full package period (no early return inside that window).
     */
    public static void validateMinimumReturnForPackage(LocalDate pickup, LocalDate returnDate, String planType) {
        String p = normalizePlanType(planType);
        if ("DAILY".equals(p)) {
            return;
        }
        LocalDate minReturn = firstPackagePeriodEnd(pickup, p);
        if (returnDate.isBefore(minReturn)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "For " + p + " packages, return must be on or after " + minReturn
                            + " (one full period from pickup).");
        }
    }

    /**
     * Subtotal: each full week/month/year segment from pickup at the plan discount; any trailing days at full daily rate.
     * Daily plan: all days at daily rate (no package discount).
     */
    public static double computeSubtotalSegments(LocalDate pickup, LocalDate returnDate, String planType, double pricePerDay) {
        if (pricePerDay <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vehicle daily rate is invalid");
        }
        String p = normalizePlanType(planType);
        int totalDays = rentalDays(pickup, returnDate);
        if (totalDays < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rental must be at least one day");
        }
        PricingPlanStrategy plan = PricingPlanStrategy.fromNormalizedPlan(p);
        if (plan == PricingPlanStrategy.DAILY) {
            return round2(totalDays * pricePerDay);
        }
        double planDisc = plan.packageDiscountPercent() / 100.0;
        double subtotal = 0.0;
        LocalDate pos = pickup;
        while (pos.isBefore(returnDate)) {
            LocalDate boundary = plan.rawNextBoundary(pos, returnDate);
            LocalDate segEnd = boundary.isBefore(returnDate) ? boundary : returnDate;
            int days = (int) ChronoUnit.DAYS.between(pos, segEnd);
            if (days <= 0) {
                break;
            }
            boolean fullPackageSegment = segEnd.equals(boundary);
            if (fullPackageSegment) {
                subtotal += days * pricePerDay * (1.0 - planDisc);
            } else {
                subtotal += days * pricePerDay;
            }
            pos = segEnd;
        }
        return round2(subtotal);
    }

    public static PriceBreakdown computePriceBreakdown(LocalDate pickup, LocalDate returnDate, String planType, double pricePerDay) {
        int days = rentalDays(pickup, returnDate);
        double discountPct = discountPercentForPlan(planType);
        double subtotal = computeSubtotalSegments(pickup, returnDate, planType, pricePerDay);
        double insurance = round2(Math.min(10.0 * days, 700.0));
        double serviceFee = SERVICE_FEE;
        double taxable = subtotal + insurance + serviceFee;
        double tax = round2(taxable * TAX_RATE);
        double total = round2(taxable + tax);
        return new PriceBreakdown(days, discountPct, subtotal, insurance, serviceFee, tax, total);
    }

    public static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    public record PriceBreakdown(
            int rentalDays,
            double discountPercent,
            double subtotal,
            double insurance,
            double serviceFee,
            double tax,
            double total
    ) {
    }
}
