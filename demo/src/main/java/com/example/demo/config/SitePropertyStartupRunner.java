package com.example.demo.config;

import com.example.demo.service.SitePropertyService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Ensures the vehicles hero MP4 URL exists in the database on startup so a fresh DB (or bad manual inserts)
 * still serves a playable video from {@code GET /api/site-properties/vehicles-hero}.
 */
@Component
@Order(100)
public class SitePropertyStartupRunner implements ApplicationRunner {

    private final SitePropertyService sitePropertyService;

    public SitePropertyStartupRunner(SitePropertyService sitePropertyService) {
        this.sitePropertyService = sitePropertyService;
    }

    @Override
    public void run(ApplicationArguments args) {
        sitePropertyService.ensureDefaultVehiclesHeroIfMissing();
    }
}
