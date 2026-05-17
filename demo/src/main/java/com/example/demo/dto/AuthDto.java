package com.example.demo.dto;

import com.example.demo.model.AppUser;
import com.example.demo.model.RentalBooking;
import com.example.demo.model.UserDamageReport;
import com.example.demo.model.Vehicle;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request/response records for {@link com.example.demo.controller.AuthController}.
 */
public final class AuthDto {

    private AuthDto() {
    }

    public record RegisterRequest(String name, String email, String phone, String password) {
    }

    public record LoginRequest(String email, String password) {
    }

    public record ProfilePhotoRequest(String imageUrl) {
    }

    public record UpdateProfileRequest(String name, String email, String phone) {
    }

    public record UpdatePasswordRequest(String currentPassword, String newPassword) {
    }

    public record AuthUserResponse(
            Long id,
            String name,
            String email,
            String phone,
            String profileImageUrl,
            LocalDateTime createdAt
    ) {
        public static AuthUserResponse from(AppUser user) {
            return new AuthUserResponse(
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getProfileImageUrl(),
                    user.getCreatedAt()
            );
        }
    }

    public record BookingHistoryResponse(
            Long id,
            Long vehicleId,
            String vehicleName,
            String vehicleBrand,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Double totalAmount
    ) {
        public static BookingHistoryResponse from(RentalBooking booking) {
            Vehicle v = booking.getVehicle();
            return new BookingHistoryResponse(
                    booking.getId(),
                    v.getId(),
                    v.getName(),
                    v.getBrand(),
                    booking.getPickupDate(),
                    booking.getReturnDate(),
                    booking.getStatus(),
                    booking.getTotalAmount()
            );
        }
    }

    public record DamageReportResponse(
            Long id,
            Long rentalBookingId,
            Long vehicleId,
            String vehicleName,
            String vehicleBrand,
            String plateNumber,
            String description,
            String severity,
            String status,
            LocalDate incidentDate,
            Double estimatedCost
    ) {
        public static DamageReportResponse from(UserDamageReport report) {
            Vehicle v = report.getVehicle();
            Long rentalId = report.getRentalBooking() != null ? report.getRentalBooking().getId() : null;
            return new DamageReportResponse(
                    report.getId(),
                    rentalId,
                    v.getId(),
                    v.getName(),
                    v.getBrand(),
                    v.getPlateNumber() != null ? v.getPlateNumber() : "",
                    report.getDescription(),
                    report.getSeverity(),
                    report.getStatus(),
                    report.getIncidentDate(),
                    report.getEstimatedCost()
            );
        }
    }

    public record UserProfileResponse(
            AuthUserResponse user,
            List<BookingHistoryResponse> bookings,
            List<DamageReportResponse> damageReports
    ) {
    }
}
