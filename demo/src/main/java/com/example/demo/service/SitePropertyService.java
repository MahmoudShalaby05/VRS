package com.example.demo.service;

import com.example.demo.model.SiteProperty;
import com.example.demo.repository.SitePropertyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class SitePropertyService {

    private final SitePropertyRepository sitePropertyRepository;

    public SitePropertyService(SitePropertyRepository sitePropertyRepository) {
        this.sitePropertyRepository = sitePropertyRepository;
    }

    @Transactional(readOnly = true)
    public Optional<String> getValue(String key) {
        return sitePropertyRepository.findByPropertyKey(key)
                .map(SiteProperty::getPropertyValue)
                .filter(v -> v != null && !v.isBlank());
    }

    /**
     * If {@link SiteProperty#KEY_VEHICLES_HERO_MP4} is missing or blank, store the default MP4 URL so the API always returns a playable src.
     */
    @Transactional
    public void ensureDefaultVehiclesHeroIfMissing() {
        boolean missing = sitePropertyRepository.findByPropertyKey(SiteProperty.KEY_VEHICLES_HERO_MP4)
                .map(SiteProperty::getPropertyValue)
                .map(v -> v == null || v.isBlank())
                .orElse(true);
        if (missing) {
            setValue(SiteProperty.KEY_VEHICLES_HERO_MP4, SiteProperty.DEFAULT_VEHICLES_HERO_MP4);
        }
    }

    /**
     * Sets or clears a property. Blank {@code value} removes the row so clients can fall back to defaults.
     */
    @Transactional
    public void setValue(String key, String value) {
        if (key == null || key.isBlank()) {
            return;
        }
        Optional<SiteProperty> existing = sitePropertyRepository.findByPropertyKey(key.trim());
        if (value == null || value.isBlank()) {
            existing.ifPresent(sitePropertyRepository::delete);
            return;
        }
        SiteProperty row = existing.orElseGet(() -> {
            SiteProperty p = new SiteProperty();
            p.setPropertyKey(key.trim());
            return p;
        });
        row.setPropertyValue(value.trim());
        sitePropertyRepository.save(row);
    }
}
