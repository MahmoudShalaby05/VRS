package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_damage_reports")
public class UserDamageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_booking_id")
    private RentalBooking rentalBooking;

    private String description;
    private String severity;
    private String status;
    private LocalDate incidentDate;

    @Column(name = "incident_time", length = 16)
    private String incidentTime;

    @Column(name = "incident_location", length = 500)
    private String incidentLocation;

    @Lob
    @Column(name = "damage_types_json", columnDefinition = "LONGTEXT")
    private String damageTypesJson;

    @Lob
    @Column(name = "body_locations_json", columnDefinition = "LONGTEXT")
    private String bodyLocationsJson;

    @Lob
    @Column(name = "photos_json", columnDefinition = "LONGTEXT")
    private String photosJson;

    private Double estimatedCost;
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getIncidentDate() { return incidentDate; }
    public void setIncidentDate(LocalDate incidentDate) { this.incidentDate = incidentDate; }
    public Double getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(Double estimatedCost) { this.estimatedCost = estimatedCost; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public RentalBooking getRentalBooking() { return rentalBooking; }
    public void setRentalBooking(RentalBooking rentalBooking) { this.rentalBooking = rentalBooking; }

    public String getIncidentTime() { return incidentTime; }
    public void setIncidentTime(String incidentTime) { this.incidentTime = incidentTime; }

    public String getIncidentLocation() { return incidentLocation; }
    public void setIncidentLocation(String incidentLocation) { this.incidentLocation = incidentLocation; }

    public String getDamageTypesJson() { return damageTypesJson; }
    public void setDamageTypesJson(String damageTypesJson) { this.damageTypesJson = damageTypesJson; }

    public String getBodyLocationsJson() { return bodyLocationsJson; }
    public void setBodyLocationsJson(String bodyLocationsJson) { this.bodyLocationsJson = bodyLocationsJson; }

    public String getPhotosJson() { return photosJson; }
    public void setPhotosJson(String photosJson) { this.photosJson = photosJson; }
}
