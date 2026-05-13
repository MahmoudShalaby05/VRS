package com.example.demo.controller;

import com.example.demo.model.RentalBooking;
import com.example.demo.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public java.util.List<BookingResponse> listAll() {
        return bookingService.findAllForAdmin().stream().map(BookingResponse::fromEntity).toList();
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse checkout(@RequestBody CheckoutRequest request) {
        RentalBooking saved = bookingService.createCheckoutBooking(
                request.userId(),
                request.vehicleId(),
                request.pickupDate(),
                request.returnDate(),
                request.planType(),
                request.paymentMethod(),
                request.pickupCity(),
                request.cardLast4()
        );
        return BookingResponse.fromEntity(saved);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createAdmin(@RequestBody AdminBookingRequest request) {
        RentalBooking saved = bookingService.createAdminBooking(
                request.userId(),
                request.guestName(),
                request.guestEmail(),
                request.vehicleId(),
                request.pickupDate(),
                request.returnDate(),
                request.planType(),
                request.paymentMethod(),
                request.status()
        );
        return BookingResponse.fromEntity(saved);
    }

    @PutMapping("/{id}")
    public BookingResponse updateAdmin(@PathVariable Long id, @RequestBody AdminBookingRequest request) {
        RentalBooking saved = bookingService.updateAdminBooking(
                id,
                request.userId(),
                request.guestName(),
                request.guestEmail(),
                request.vehicleId(),
                request.pickupDate(),
                request.returnDate(),
                request.planType(),
                request.paymentMethod(),
                request.status()
        );
        return BookingResponse.fromEntity(saved);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bookingService.deleteBooking(id);
    }

    public record CheckoutRequest(
            Long userId,
            Long vehicleId,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String pickupCity,
            String cardLast4
    ) {
    }

    public record AdminBookingRequest(
            Long userId,
            String guestName,
            String guestEmail,
            Long vehicleId,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String status
    ) {
    }

    public record BookingResponse(
            Long id,
            Long userId,
            String guestName,
            String guestEmail,
            Long vehicleId,
            String vehicleName,
            String vehicleBrand,
            LocalDate pickupDate,
            LocalDate returnDate,
            String planType,
            String paymentMethod,
            String status,
            Integer rentalDays,
            Double discountPercent,
            Double subtotal,
            Double insuranceAmount,
            Double serviceFee,
            Double taxAmount,
            Double totalAmount,
            String createdAt
    ) {
        static BookingResponse fromEntity(RentalBooking b) {
            var v = b.getVehicle();
            return new BookingResponse(
                    b.getId(),
                    b.getUser() != null ? b.getUser().getId() : null,
                    b.getGuestName(),
                    b.getGuestEmail(),
                    v != null ? v.getId() : null,
                    v != null ? v.getName() : null,
                    v != null ? v.getBrand() : null,
                    b.getPickupDate(),
                    b.getReturnDate(),
                    b.getPlanType(),
                    b.getPaymentMethod(),
                    b.getStatus(),
                    b.getRentalDays(),
                    b.getDiscountPercent(),
                    b.getSubtotal(),
                    b.getInsuranceAmount(),
                    b.getServiceFee(),
                    b.getTaxAmount(),
                    b.getTotalAmount(),
                    b.getCreatedAt() != null ? b.getCreatedAt().toString() : null
            );
        }
    }
}
