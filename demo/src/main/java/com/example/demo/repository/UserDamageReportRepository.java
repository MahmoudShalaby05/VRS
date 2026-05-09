package com.example.demo.repository;

import com.example.demo.model.UserDamageReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserDamageReportRepository extends JpaRepository<UserDamageReport, Long> {
    List<UserDamageReport> findByUserIdOrderByCreatedAtDesc(Long userId);
}
