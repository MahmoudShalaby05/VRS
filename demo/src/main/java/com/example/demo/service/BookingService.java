package com.example.demo.service;

import com.example.demo.model.AppUser;
import com.example.demo.model.RentalBooking;
import com.example.demo.model.Vehicle;
import com.example.demo.repository.AppUserRepository;
import com.example.demo.repository.RentalBookingRepository;
import com.example.demo.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class BookingService {

    private final RentalBookingRepository rentalBookingRepository;
    private final VehicleRepository vehicleRepository;
    private final AppUserRepository appUserRepository;

    public BookingService(
            RentalBookingRepository rentalBookingRepository,
            VehicleRepository vehicleRepository,
            AppUserRepository appUserRepository
    ) {
        this.rentalBookingRepository = rentalBookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public List<RentalBooking> findAllForAdmin() {
        return rentalBookingRepository.findAllWithUserAndVehicle();
    }

    @Transactional(readOnly = true)
    public List<RentalBooking> findForUserProfile(Long userId) {
        return rentalBookingRepository.findByUserIdWithVehicle(userId);
    }

    @Transactional
    public RentalBooking createCheckoutBooking(
            Long userId,
            Long vehicleId,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String pickupCity,
            String cardLast4
    ) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return persistBooking(
                user,
                user.getName(),
                user.getEmail(),
                vehicleId,
                pickupDate,
                returnDate,
                planType,
                paymentMethod,
                pickupCity,
                cardLast4,
                "Confirmed",
                true,
                true
        );
    }

    @Transactional
    public RentalBooking createAdminBooking(
            Long optionalUserId,
            String guestName,
            String guestEmail,
            Long vehicleId,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String status
    ) {
        if (guestName == null || guestName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }
        AppUser user = null;
        if (optionalUserId != null) {
            user = appUserRepository.findById(optionalUserId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Linked user not found"));
        }
        String email = guestEmail != null && !guestEmail.isBlank() ? guestEmail.trim() : (user != null ? user.getEmail() : null);
        return persistBooking(
                user,
                guestName.trim(),
                email,
                vehicleId,
                pickupDate,
                returnDate,
                planType,
                paymentMethod == null || paymentMethod.isBlank() ? "Cash" : paymentMethod,
                null,
                null,
                normalizeAdminStatus(status),
                false,
                false
        );
    }

    @Transactional
    public RentalBooking updateAdminBooking(
            Long bookingId,
            Long optionalUserId,
            String guestName,
            String guestEmail,
            Long vehicleId,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String status
    ) {
        RentalBooking existing = rentalBookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        Long oldVehicleId = existing.getVehicle().getId();

        if (guestName == null || guestName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer name is required");
        }
        AppUser user = null;
        if (optionalUserId != null) {
            user = appUserRepository.findById(optionalUserId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Linked user not found"));
        }
        existing.setUser(user);
        existing.setGuestName(guestName.trim());
        existing.setGuestEmail(guestEmail != null && !guestEmail.isBlank() ? guestEmail.trim() : (user != null ? user.getEmail() : null));

        Vehicle vehicle = loadVehicleUnlessMaintenance(vehicleId);
        BookingPricing.validateDateRange(pickupDate, returnDate);
        if (rentalBookingRepository.countBlockingOverlap(vehicleId, pickupDate, returnDate, bookingId) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vehicle is not available for these dates");
        }

        applyBookingCore(existing, vehicle, pickupDate, returnDate, planType, paymentMethod, normalizeAdminStatus(status), false);

        RentalBooking saved = rentalBookingRepository.save(existing);
        refreshVehicleAvailability(oldVehicleId);
        if (!oldVehicleId.equals(vehicle.getId())) {
            refreshVehicleAvailability(vehicle.getId());
        }
        return saved;
    }

    @Transactional
    public void deleteBooking(Long id) {
        RentalBooking booking = rentalBookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        Long vehicleId = booking.getVehicle().getId();
        rentalBookingRepository.delete(booking);
        refreshVehicleAvailability(vehicleId);
    }

    private RentalBooking persistBooking(
            AppUser user,
            String guestName,
            String guestEmail,
            Long vehicleId,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String pickupCity,
            String cardLast4,
            String status,
            boolean enforceCustomerPickupRule,
            boolean publicCheckout
    ) {
        Vehicle vehicle = publicCheckout ? loadVehicleForPublicCheckout(vehicleId) : loadVehicleUnlessMaintenance(vehicleId);

        String normalizedPlan = planType == null || planType.isBlank() ? "DAILY" : planType.trim().toUpperCase();
        if (enforceCustomerPickupRule) {
            BookingPricing.validateDatesForCustomer(pickupDate, returnDate, LocalDate.now(), normalizedPlan);
        } else {
            BookingPricing.validateDateRange(pickupDate, returnDate);
        }
        if (rentalBookingRepository.countBlockingOverlap(vehicleId, pickupDate, returnDate, null) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vehicle is not available for these dates");
        }

        RentalBooking booking = new RentalBooking();
        booking.setUser(user);
        booking.setGuestName(guestName);
        booking.setGuestEmail(guestEmail);
        booking.setPickupCity(pickupCity);
        booking.setPaymentMethod(paymentMethod);
        booking.setCardLast4(cardLast4);
        applyBookingCore(booking, vehicle, pickupDate, returnDate, planType, paymentMethod, status, enforceCustomerPickupRule);

        RentalBooking saved = rentalBookingRepository.save(booking);
        refreshVehicleAvailability(vehicle.getId());
        return saved;
    }

    private void applyBookingCore(
            RentalBooking booking,
            Vehicle vehicle,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String status,
            boolean enforceCustomerPickupRule
    ) {
        double pricePerDay = vehicle.getPricePerDay() == null ? 0 : vehicle.getPricePerDay();
        String normalizedPlan = planType == null || planType.isBlank() ? "DAILY" : planType.trim().toUpperCase();
        if (enforceCustomerPickupRule) {
            BookingPricing.validateDatesForCustomer(pickupDate, returnDate, LocalDate.now(), normalizedPlan);
        } else {
            BookingPricing.validateDateRange(pickupDate, returnDate);
        }
        BookingPricing.PriceBreakdown breakdown = BookingPricing.computePriceBreakdown(pickupDate, returnDate, normalizedPlan, pricePerDay);

        booking.setVehicle(vehicle);
        booking.setPickupDate(pickupDate);
        booking.setReturnDate(returnDate);
        booking.setPlanType(normalizedPlan);
        booking.setPaymentMethod(paymentMethod == null || paymentMethod.isBlank() ? "Cash" : paymentMethod);
        booking.setStatus(status);
        booking.setRentalDays(breakdown.rentalDays());
        booking.setDiscountPercent(breakdown.discountPercent());
        booking.setSubtotal(breakdown.subtotal());
        booking.setInsuranceAmount(breakdown.insurance());
        booking.setServiceFee(breakdown.serviceFee());
        booking.setTaxAmount(breakdown.tax());
        booking.setTotalAmount(breakdown.total());
    }

    private Vehicle loadVehicleUnlessMaintenance(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        String st = vehicle.getAvailabilityStatus();
        if (st != null && st.equalsIgnoreCase("Maintenance")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vehicle is in maintenance and cannot be booked");
        }
        return vehicle;
    }

    private Vehicle loadVehicleForPublicCheckout(Long vehicleId) {
        Vehicle vehicle = loadVehicleUnlessMaintenance(vehicleId);
        String st = vehicle.getAvailabilityStatus();
        if (st != null && st.equalsIgnoreCase("Booked")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This vehicle is not available for booking");
        }
        return vehicle;
    }

    private String normalizeAdminStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Pending";
        }
        for (String allowed : List.of("Pending", "Confirmed", "Completed", "Cancelled")) {
            if (allowed.equalsIgnoreCase(status)) {
                return allowed;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid booking status");
    }

    @Transactional
    public void refreshVehicleAvailability(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null) {
            return;
        }
        String current = vehicle.getAvailabilityStatus();
        if (current != null && current.equalsIgnoreCase("Maintenance")) {
            return;
        }
        long active = rentalBookingRepository.countActiveReservations(vehicleId, LocalDate.now());
        vehicle.setAvailabilityStatus(active > 0 ? "Booked" : "Available");
        vehicleRepository.save(vehicle);
    }
}
