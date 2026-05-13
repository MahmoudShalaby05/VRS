package com.example.demo.repository;

import com.example.demo.model.UserDamageReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserDamageReportRepository extends JpaRepository<UserDamageReport, Long> {

    @Query("""
            SELECT d FROM UserDamageReport d
            JOIN FETCH d.vehicle v
            LEFT JOIN FETCH d.rentalBooking rb
            WHERE d.user.id = :userId
            ORDER BY d.createdAt DESC
            """)
    List<UserDamageReport> findByUserIdForProfile(@Param("userId") Long userId);

    @Query("""
            SELECT d FROM UserDamageReport d
            JOIN FETCH d.user u
            JOIN FETCH d.vehicle v
            LEFT JOIN FETCH d.rentalBooking rb
            ORDER BY d.createdAt DESC
            """)
    List<UserDamageReport> findAllForAdmin();
}
