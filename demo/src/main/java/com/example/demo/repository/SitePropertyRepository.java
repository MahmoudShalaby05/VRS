package com.example.demo.repository;

import com.example.demo.model.SiteProperty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SitePropertyRepository extends JpaRepository<SiteProperty, Long> {
    Optional<SiteProperty> findByPropertyKey(String propertyKey);
}
