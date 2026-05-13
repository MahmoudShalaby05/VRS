package com.example.demo.repository;

import com.example.demo.model.RentalBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface RentalBookingRepository extends JpaRepository<RentalBooking, Long> {

    @Query("""
            SELECT b FROM RentalBooking b
            JOIN FETCH b.vehicle
            WHERE b.user.id = :userId
            ORDER BY b.createdAt DESC
            """)
    List<RentalBooking> findByUserIdWithVehicle(@Param("userId") Long userId);

    @Query("""
            SELECT b FROM RentalBooking b
            JOIN FETCH b.vehicle v
            WHERE b.user.id = :userId
            AND b.status <> 'Cancelled'
            ORDER BY b.pickupDate DESC
            """)
    List<RentalBooking> findEligibleRentalsForDamageReport(@Param("userId") Long userId);

    @Query("""
            SELECT DISTINCT b FROM RentalBooking b
            LEFT JOIN FETCH b.user
            JOIN FETCH b.vehicle
            ORDER BY b.createdAt DESC
            """)
    List<RentalBooking> findAllWithUserAndVehicle();

    @Query("""
            SELECT COUNT(b) FROM RentalBooking b
            WHERE b.vehicle.id = :vehicleId
            AND b.status IN ('Confirmed', 'Pending')
            AND b.pickupDate <= :endDate
            AND b.returnDate >= :startDate
            AND (:excludeId IS NULL OR b.id <> :excludeId)
            """)
    long countBlockingOverlap(
            @Param("vehicleId") Long vehicleId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );

    @Query("""
            SELECT COUNT(b) FROM RentalBooking b
            WHERE b.vehicle.id = :vehicleId
            AND b.status IN ('Confirmed', 'Pending')
            AND b.returnDate >= :today
            """)
    long countActiveReservations(@Param("vehicleId") Long vehicleId, @Param("today") LocalDate today);
}
