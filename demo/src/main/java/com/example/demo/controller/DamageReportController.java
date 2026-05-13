package com.example.demo.controller;

import com.example.demo.model.RentalBooking;
import com.example.demo.model.UserDamageReport;
import com.example.demo.model.Vehicle;
import com.example.demo.service.DamageReportService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/damage-reports")
public class DamageReportController {

    private final DamageReportService damageReportService;

    public DamageReportController(DamageReportService damageReportService) {
        this.damageReportService = damageReportService;
    }

    @GetMapping("/eligible-rentals")
    public List<EligibleRentalResponse> eligibleRentals(@RequestParam Long userId) {
        return damageReportService.findEligibleRentals(userId).stream()
                .map(EligibleRentalResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DamageReportCreatedResponse createPublic(@RequestBody PublicDamageReportRequest request) {
        UserDamageReport saved = damageReportService.createPublicReport(
                request.userId(),
                request.rentalBookingId(),
                request.description(),
                request.severity(),
                request.incidentDate(),
                request.incidentTime(),
                request.incidentLocation(),
                request.damageTypes(),
                request.bodyLocations(),
                request.photos(),
                request.estimatedCost()
        );
        return new DamageReportCreatedResponse(saved.getId(), saved.getIncidentDate(), saved.getStatus());
    }

    @GetMapping
    public List<AdminDamageReportResponse> listForAdmin() {
        return damageReportService.findAllForAdmin().stream()
                .map(r -> AdminDamageReportResponse.from(r, damageReportService))
                .toList();
    }

    @PostMapping("/admin")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminDamageReportResponse createAdmin(@RequestBody AdminDamageReportRequest request) {
        UserDamageReport saved = damageReportService.createAdminReport(
                request.userId(),
                request.vehicleId(),
                request.description(),
                request.severity(),
                request.status(),
                request.incidentDate(),
                request.estimatedCost(),
                request.photo()
        );
        return AdminDamageReportResponse.from(saved, damageReportService);
    }

    @PutMapping("/{id}")
    public AdminDamageReportResponse updateAdmin(@PathVariable Long id, @RequestBody AdminDamageReportRequest request) {
        UserDamageReport saved = damageReportService.updateAdminReport(
                id,
                request.userId(),
                request.vehicleId(),
                request.description(),
                request.severity(),
                request.status(),
                request.incidentDate(),
                request.estimatedCost(),
                request.photo()
        );
        return AdminDamageReportResponse.from(saved, damageReportService);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        damageReportService.deleteById(id);
    }

    public record PublicDamageReportRequest(
            Long userId,
            Long rentalBookingId,
            String description,
            String severity,
            LocalDate incidentDate,
            String incidentTime,
            String incidentLocation,
            List<String> damageTypes,
            List<String> bodyLocations,
            List<String> photos,
            Double estimatedCost
    ) {
    }

    public record DamageReportCreatedResponse(Long id, LocalDate incidentDate, String status) {
    }

    public record EligibleRentalResponse(
            Long bookingId,
            Long vehicleId,
            String plateNumber,
            String vehicleName,
            String vehicleBrand,
            Integer modelYear,
            String imageUrl,
            LocalDate pickupDate,
            LocalDate returnDate,
            String bookingStatus
    ) {
        static EligibleRentalResponse from(RentalBooking b) {
            Vehicle v = b.getVehicle();
            return new EligibleRentalResponse(
                    b.getId(),
                    v != null ? v.getId() : null,
                    v != null && v.getPlateNumber() != null ? v.getPlateNumber() : "",
                    v != null ? v.getName() : "",
                    v != null ? v.getBrand() : "",
                    v != null ? v.getModelYear() : null,
                    v != null ? v.getImageUrl() : null,
                    b.getPickupDate(),
                    b.getReturnDate(),
                    b.getStatus()
            );
        }
    }

    public record AdminDamageReportRequest(
            Long userId,
            Long vehicleId,
            String description,
            String severity,
            String status,
            LocalDate incidentDate,
            Double estimatedCost,
            String photo
    ) {
    }

    public record AdminDamageReportResponse(
            Long id,
            Long userId,
            String userName,
            Long vehicleId,
            String vehicleName,
            String vehicleBrand,
            String plateNumber,
            Long rentalBookingId,
            String description,
            String severity,
            String status,
            LocalDate incidentDate,
            Double estimatedCost,
            String photo
    ) {
        static AdminDamageReportResponse from(UserDamageReport r, DamageReportService svc) {
            Vehicle v = r.getVehicle();
            return new AdminDamageReportResponse(
                    r.getId(),
                    r.getUser() != null ? r.getUser().getId() : null,
                    r.getUser() != null ? r.getUser().getName() : null,
                    v != null ? v.getId() : null,
                    v != null ? v.getName() : null,
                    v != null ? v.getBrand() : null,
                    v != null ? v.getPlateNumber() : null,
                    r.getRentalBooking() != null ? r.getRentalBooking().getId() : null,
                    r.getDescription(),
                    r.getSeverity(),
                    r.getStatus(),
                    r.getIncidentDate(),
                    r.getEstimatedCost(),
                    svc.firstPhotoOrNull(r.getPhotosJson())
            );
        }
    }
}
