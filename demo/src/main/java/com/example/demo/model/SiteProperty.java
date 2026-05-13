package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Key/value site-wide content (e.g. vehicles page hero video URLs) so it can differ per environment / DB.
 */
@Entity
@Table(
        name = "site_properties",
        uniqueConstraints = @UniqueConstraint(name = "uk_site_property_key", columnNames = "property_key")
)
public class SiteProperty {

    public static final String KEY_VEHICLES_HERO_MP4 = "vehicles.hero.mp4";
    public static final String KEY_VEHICLES_HERO_POSTER = "vehicles.hero.poster";

    /** Used when DB has no usable hero URL so the page is never a blank/black hero. */
    public static final String DEFAULT_VEHICLES_HERO_MP4 =
            "https://cdn.coverr.co/videos/coverr-aerial-view-of-road-1579/1080p.mp4";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_key", nullable = false, length = 128)
    private String propertyKey;

    @Column(name = "property_value", nullable = false, length = 4000)
    private String propertyValue;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPropertyKey() {
        return propertyKey;
    }

    public void setPropertyKey(String propertyKey) {
        this.propertyKey = propertyKey;
    }

    public String getPropertyValue() {
        return propertyValue;
    }

    public void setPropertyValue(String propertyValue) {
        this.propertyValue = propertyValue;
    }
}
