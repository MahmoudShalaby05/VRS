package com.example.demo.controller;

import com.example.demo.model.AppUser;
import com.example.demo.model.UserBookingHistory;
import com.example.demo.model.UserDamageReport;
import com.example.demo.model.Vehicle;
import com.example.demo.repository.AppUserRepository;
import com.example.demo.repository.UserBookingHistoryRepository;
import com.example.demo.repository.UserDamageReportRepository;
import com.example.demo.repository.VehicleRepository;
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
    private final VehicleRepository vehicleRepository;
    private final UserBookingHistoryRepository userBookingHistoryRepository;
    private final UserDamageReportRepository userDamageReportRepository;

    public AuthController(AppUserRepository appUserRepository,
                          VehicleRepository vehicleRepository,
                          UserBookingHistoryRepository userBookingHistoryRepository,
                          UserDamageReportRepository userDamageReportRepository) {
        this.appUserRepository = appUserRepository;
        this.vehicleRepository = vehicleRepository;
        this.userBookingHistoryRepository = userBookingHistoryRepository;
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

        List<BookingHistoryResponse> bookings = userBookingHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(BookingHistoryResponse::from)
                .toList();

        List<DamageReportResponse> damageReports = userDamageReportRepository.findByUserIdOrderByCreatedAtDesc(userId)
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

    @PostMapping("/profile/{userId}/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingHistoryResponse createBookingHistory(@PathVariable Long userId, @RequestBody CreateBookingRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        UserBookingHistory booking = new UserBookingHistory();
        booking.setUser(user);
        booking.setVehicle(vehicle);
        booking.setStartDate(request.startDate());
        booking.setEndDate(request.endDate());
        booking.setStatus(request.status() == null || request.status().isBlank() ? "Completed" : request.status());
        booking.setTotalAmount(request.totalAmount() == null ? 0 : request.totalAmount());

        return BookingHistoryResponse.from(userBookingHistoryRepository.save(booking));
    }

    @PostMapping("/profile/{userId}/damage-reports")
    @ResponseStatus(HttpStatus.CREATED)
    public DamageReportResponse createDamageReport(@PathVariable Long userId, @RequestBody CreateDamageReportRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        UserDamageReport report = new UserDamageReport();
        report.setUser(user);
        report.setVehicle(vehicle);
        report.setDescription(request.description());
        report.setSeverity(request.severity() == null || request.severity().isBlank() ? "Medium" : request.severity());
        report.setStatus(request.status() == null || request.status().isBlank() ? "Reported" : request.status());
        report.setIncidentDate(request.incidentDate());
        report.setEstimatedCost(request.estimatedCost() == null ? 0 : request.estimatedCost());

        return DamageReportResponse.from(userDamageReportRepository.save(report));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    public record RegisterRequest(String name, String email, String phone, String password) {}

    public record LoginRequest(String email, String password) {}

    public record ProfilePhotoRequest(String imageUrl) {}

    public record CreateBookingRequest(Long vehicleId, LocalDate startDate, LocalDate endDate, String status, Double totalAmount) {}

    public record CreateDamageReportRequest(Long vehicleId, String description, String severity, String status, LocalDate incidentDate, Double estimatedCost) {}

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
        static BookingHistoryResponse from(UserBookingHistory booking) {
            return new BookingHistoryResponse(
                    booking.getId(),
                    booking.getVehicle().getId(),
                    booking.getVehicle().getName(),
                    booking.getVehicle().getBrand(),
                    booking.getStartDate(),
                    booking.getEndDate(),
                    booking.getStatus(),
                    booking.getTotalAmount()
            );
        }
    }

    public record DamageReportResponse(Long id,
                                       Long vehicleId,
                                       String vehicleName,
                                       String description,
                                       String severity,
                                       String status,
                                       LocalDate incidentDate,
                                       Double estimatedCost) {
        static DamageReportResponse from(UserDamageReport report) {
            return new DamageReportResponse(
                    report.getId(),
                    report.getVehicle().getId(),
                    report.getVehicle().getName(),
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
