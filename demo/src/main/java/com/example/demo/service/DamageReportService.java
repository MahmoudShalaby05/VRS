package com.example.demo.service;

import com.example.demo.model.AppUser;
import com.example.demo.model.RentalBooking;
import com.example.demo.model.UserDamageReport;
import com.example.demo.model.Vehicle;
import com.example.demo.repository.AppUserRepository;
import com.example.demo.repository.RentalBookingRepository;
import com.example.demo.repository.UserDamageReportRepository;
import com.example.demo.repository.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
public class DamageReportService {

    private final UserDamageReportRepository userDamageReportRepository;
    private final RentalBookingRepository rentalBookingRepository;
    private final AppUserRepository appUserRepository;
    private final VehicleRepository vehicleRepository;

    public DamageReportService(
            UserDamageReportRepository userDamageReportRepository,
            RentalBookingRepository rentalBookingRepository,
            AppUserRepository appUserRepository,
            VehicleRepository vehicleRepository
    ) {
        this.userDamageReportRepository = userDamageReportRepository;
        this.rentalBookingRepository = rentalBookingRepository;
        this.appUserRepository = appUserRepository;
        this.vehicleRepository = vehicleRepository;
    }

    @Transactional(readOnly = true)
    public List<RentalBooking> findEligibleRentals(Long userId) {
        appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return rentalBookingRepository.findEligibleRentalsForDamageReport(userId);
    }

    @Transactional(readOnly = true)
    public List<UserDamageReport> findAllForAdmin() {
        return userDamageReportRepository.findAllForAdmin();
    }

    @Transactional
    public UserDamageReport createPublicReport(
            Long userId,
            Long rentalBookingId,
            String description,
            String severityUi,
            LocalDate incidentDate,
            String incidentTime,
            String incidentLocation,
            List<String> damageTypes,
            List<String> bodyLocations,
            List<String> photos,
            Double estimatedCost
    ) {
        if (rentalBookingId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rental booking is required");
        }
        if (description == null || description.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
        if (incidentDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incident date is required");
        }
        if (incidentLocation == null || incidentLocation.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incident location is required");
        }

        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        RentalBooking booking = rentalBookingRepository.findById(rentalBookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rental booking not found"));
        if (booking.getUser() == null || !booking.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This rental does not belong to your account");
        }
        Vehicle vehicle = booking.getVehicle();
        if (vehicle == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking has no vehicle");
        }

        UserDamageReport report = new UserDamageReport();
        report.setUser(user);
        report.setVehicle(vehicle);
        report.setRentalBooking(booking);
        report.setDescription(description);
        report.setSeverity(mapSeverityFromUi(severityUi));
        report.setStatus("Reported");
        report.setIncidentDate(incidentDate);
        report.setIncidentTime(blankToNull(incidentTime));
        report.setIncidentLocation(incidentLocation);
        report.setDamageTypesJson(writeJsonStringArray(damageTypes));
        report.setBodyLocationsJson(writeJsonStringArray(bodyLocations));
        report.setPhotosJson(writeJsonStringArray(photos));
        report.setEstimatedCost(estimatedCost == null ? 0.0 : estimatedCost);

        return userDamageReportRepository.save(report);
    }

    @Transactional
    public UserDamageReport createAdminReport(
            Long userId,
            Long vehicleId,
            String description,
            String severity,
            String status,
            LocalDate incidentDate,
            Double estimatedCost,
            String photoDataUrl
    ) {
        if (description == null || description.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        UserDamageReport report = new UserDamageReport();
        report.setUser(user);
        report.setVehicle(vehicle);
        report.setRentalBooking(null);
        report.setDescription(description);
        report.setSeverity(normalizeSeverity(severity));
        report.setStatus(normalizeStatus(status));
        report.setIncidentDate(incidentDate != null ? incidentDate : LocalDate.now());
        report.setIncidentTime(null);
        report.setIncidentLocation(null);
        report.setDamageTypesJson(writeJsonStringArray(Collections.emptyList()));
        report.setBodyLocationsJson(writeJsonStringArray(Collections.emptyList()));
        report.setPhotosJson(photoJsonFromSingle(photoDataUrl));
        report.setEstimatedCost(estimatedCost == null ? 0.0 : estimatedCost);

        return userDamageReportRepository.save(report);
    }

    @Transactional
    public UserDamageReport updateAdminReport(
            Long id,
            Long userId,
            Long vehicleId,
            String description,
            String severity,
            String status,
            LocalDate incidentDate,
            Double estimatedCost,
            String photoDataUrl
    ) {
        if (description == null || description.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Description is required");
        }
        UserDamageReport report = userDamageReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found"));
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));

        report.setUser(user);
        report.setVehicle(vehicle);
        report.setDescription(description);
        report.setSeverity(normalizeSeverity(severity));
        report.setStatus(normalizeStatus(status));
        if (incidentDate != null) {
            report.setIncidentDate(incidentDate);
        }
        report.setEstimatedCost(estimatedCost == null ? 0.0 : estimatedCost);
        if (photoDataUrl != null && !photoDataUrl.isBlank()) {
            report.setPhotosJson(photoJsonFromSingle(photoDataUrl));
        }

        return userDamageReportRepository.save(report);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!userDamageReportRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Damage report not found");
        }
        userDamageReportRepository.deleteById(id);
    }

    private String mapSeverityFromUi(String severityUi) {
        if (severityUi == null || severityUi.isBlank()) {
            return "Medium";
        }
        return switch (severityUi.trim().toLowerCase()) {
            case "minor" -> "Low";
            case "moderate" -> "Medium";
            case "severe" -> "High";
            default -> normalizeSeverity(severityUi);
        };
    }

    private String normalizeSeverity(String severity) {
        if (severity == null || severity.isBlank()) {
            return "Medium";
        }
        for (String allowed : List.of("Low", "Medium", "High", "Critical")) {
            if (allowed.equalsIgnoreCase(severity)) {
                return allowed;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid severity");
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Reported";
        }
        for (String allowed : List.of("Reported", "Under Review", "Repairing", "Resolved")) {
            if (allowed.equalsIgnoreCase(status)) {
                return allowed;
            }
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
    }

    private String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private String writeJsonStringArray(List<String> list) {
        List<String> safe = list == null ? Collections.emptyList() : list;
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < safe.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append('"').append(escapeJsonString(safe.get(i))).append('"');
        }
        sb.append(']');
        return sb.toString();
    }

    private static String escapeJsonString(String raw) {
        if (raw == null) {
            return "";
        }
        StringBuilder o = new StringBuilder();
        for (int i = 0; i < raw.length(); i++) {
            char c = raw.charAt(i);
            switch (c) {
                case '\\' -> o.append("\\\\");
                case '"' -> o.append("\\\"");
                case '\n' -> o.append("\\n");
                case '\r' -> o.append("\\r");
                case '\t' -> o.append("\\t");
                default -> o.append(c);
            }
        }
        return o.toString();
    }

    private String photoJsonFromSingle(String photoDataUrl) {
        if (photoDataUrl == null || photoDataUrl.isBlank()) {
            return writeJsonStringArray(Collections.emptyList());
        }
        return writeJsonStringArray(List.of(photoDataUrl.trim()));
    }

    public String firstPhotoOrNull(String photosJson) {
        if (photosJson == null || photosJson.isBlank()) {
            return null;
        }
        String first = firstJsonArrayStringElement(photosJson.trim());
        return first.isEmpty() ? null : first;
    }

    /**
     * Returns the first string literal inside a JSON array, or empty string if none.
     */
    private static String firstJsonArrayStringElement(String json) {
        if (!json.startsWith("[")) {
            return "";
        }
        int q = json.indexOf('"');
        if (q < 0) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        boolean escape = false;
        for (int p = q + 1; p < json.length(); p++) {
            char c = json.charAt(p);
            if (escape) {
                switch (c) {
                    case 'n' -> sb.append('\n');
                    case 'r' -> sb.append('\r');
                    case 't' -> sb.append('\t');
                    case '\\', '"' -> sb.append(c);
                    default -> sb.append(c);
                }
                escape = false;
                continue;
            }
            if (c == '\\') {
                escape = true;
                continue;
            }
            if (c == '"') {
                break;
            }
            sb.append(c);
        }
        return sb.toString();
    }
}
