package com.example.demo.controller;

import com.example.demo.model.AppUser;
import com.example.demo.model.RentalBooking;
import com.example.demo.model.UserDamageReport;
import com.example.demo.model.Vehicle;
import com.example.demo.repository.AppUserRepository;
import com.example.demo.repository.UserDamageReportRepository;
import com.example.demo.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository appUserRepository;
    private final BookingService bookingService;
    private final UserDamageReportRepository userDamageReportRepository;

    public AuthController(AppUserRepository appUserRepository,
                          BookingService bookingService,
                          UserDamageReportRepository userDamageReportRepository) {
        this.appUserRepository = appUserRepository;
        this.bookingService = bookingService;
        this.userDamageReportRepository = userDamageReportRepository;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthUserResponse register(@RequestBody RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (request.name() == null || request.name().trim().isEmpty()
                || email.isEmpty()
                || request.phone() == null || request.phone().trim().isEmpty()
                || request.password() == null || request.password().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All fields are required");
        }

        if (appUserRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone().trim());
        user.setPassword(request.password());
        user.setCreatedAt(LocalDateTime.now());

        AppUser saved = appUserRepository.save(user);
        return AuthUserResponse.from(saved);
    }

    @PostMapping("/login")
    public AuthUserResponse login(@RequestBody LoginRequest request) {
        String email = normalizeEmail(request.email());

        if (email.isEmpty() || request.password() == null || request.password().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!user.getPassword().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return AuthUserResponse.from(user);
    }

    @GetMapping("/users")
    public Iterable<AuthUserResponse> getUsers() {
        return appUserRepository.findAll().stream().map(AuthUserResponse::from).toList();
    }

    @GetMapping("/profile/{userId}")
    public UserProfileResponse getUserProfile(@PathVariable Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<BookingHistoryResponse> bookings = bookingService.findForUserProfile(userId)
                .stream()
                .map(BookingHistoryResponse::from)
                .toList();

        List<DamageReportResponse> damageReports = userDamageReportRepository.findByUserIdForProfile(userId)
                .stream()
                .map(DamageReportResponse::from)
                .toList();

        return new UserProfileResponse(
                AuthUserResponse.from(user),
                bookings,
                damageReports
        );
    }

    @PutMapping("/profile/{userId}/photo")
    public AuthUserResponse updateProfilePhoto(@PathVariable Long userId, @RequestBody ProfilePhotoRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setProfileImageUrl(request.imageUrl() == null ? "" : request.imageUrl());
        AppUser saved = appUserRepository.save(user);
        return AuthUserResponse.from(saved);
    }

    @PutMapping("/profile/{userId}")
    public AuthUserResponse updateProfile(@PathVariable Long userId, @RequestBody UpdateProfileRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String nextEmail = normalizeEmail(request.email());
        if (request.name() == null || request.name().trim().isEmpty()
                || nextEmail.isEmpty()
                || request.phone() == null || request.phone().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email and phone are required");
        }

        if (!nextEmail.equals(user.getEmail()) && appUserRepository.existsByEmail(nextEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        user.setName(request.name().trim());
        user.setEmail(nextEmail);
        user.setPhone(request.phone().trim());

        AppUser saved = appUserRepository.save(user);
        return AuthUserResponse.from(saved);
    }

    @PutMapping("/profile/{userId}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updatePassword(@PathVariable Long userId, @RequestBody UpdatePasswordRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.currentPassword() == null || request.currentPassword().isBlank()
                || request.newPassword() == null || request.newPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current and new passwords are required");
        }

        if (!user.getPassword().equals(request.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        if (request.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        }

        user.setPassword(request.newPassword());
        appUserRepository.save(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public record RegisterRequest(String name, String email, String phone, String password) {}

    public record LoginRequest(String email, String password) {}

    public record ProfilePhotoRequest(String imageUrl) {}
    public record UpdateProfileRequest(String name, String email, String phone) {}
    public record UpdatePasswordRequest(String currentPassword, String newPassword) {}

    public record AuthUserResponse(Long id, String name, String email, String phone, String profileImageUrl, LocalDateTime createdAt) {
        static AuthUserResponse from(AppUser user) {
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

    public record BookingHistoryResponse(Long id,
                                         Long vehicleId,
                                         String vehicleName,
                                         String vehicleBrand,
                                         LocalDate startDate,
                                         LocalDate endDate,
                                         String status,
                                         Double totalAmount) {
        static BookingHistoryResponse from(RentalBooking booking) {
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

    public record DamageReportResponse(Long id,
                                       Long rentalBookingId,
                                       Long vehicleId,
                                       String vehicleName,
                                       String vehicleBrand,
                                       String plateNumber,
                                       String description,
                                       String severity,
                                       String status,
                                       LocalDate incidentDate,
                                       Double estimatedCost) {
        static DamageReportResponse from(UserDamageReport report) {
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

    public record UserProfileResponse(AuthUserResponse user,
                                      List<BookingHistoryResponse> bookings,
                                      List<DamageReportResponse> damageReports) {}
}
