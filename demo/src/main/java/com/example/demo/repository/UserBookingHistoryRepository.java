package com.example.demo.repository;

import com.example.demo.model.UserBookingHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBookingHistoryRepository extends JpaRepository<UserBookingHistory, Long> {
    List<UserBookingHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
