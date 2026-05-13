package com.example.demo.controller;

import com.example.demo.model.SiteProperty;
import com.example.demo.service.SitePropertyService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/site-properties")
public class SitePropertyController {

    private final SitePropertyService sitePropertyService;

    public SitePropertyController(SitePropertyService sitePropertyService) {
        this.sitePropertyService = sitePropertyService;
    }

    /**
     * Public read for the vehicles page hero. Missing keys return null fields; the page keeps built-in fallbacks.
     */
    @GetMapping("/vehicles-hero")
    public VehiclesHeroResponse getVehiclesHero() {
        return new VehiclesHeroResponse(
                sitePropertyService.getValue(SiteProperty.KEY_VEHICLES_HERO_MP4).orElse(null),
                sitePropertyService.getValue(SiteProperty.KEY_VEHICLES_HERO_POSTER).orElse(null)
        );
    }

    /**
     * Upsert hero video URLs. JSON body may include only the keys you want to change, e.g. {@code {"mp4":"https://..."}}.
     * Empty string clears that property (browser uses HTML fallback).
     */
    @PutMapping("/vehicles-hero")
    public VehiclesHeroResponse putVehiclesHero(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null) {
            if (body.containsKey("mp4")) {
                String mp4 = asTrimmedString(body.get("mp4"));
                assertBrowserLoadableUrl("mp4", mp4);
                sitePropertyService.setValue(SiteProperty.KEY_VEHICLES_HERO_MP4, mp4);
            }
            if (body.containsKey("poster")) {
                String poster = asTrimmedString(body.get("poster"));
                assertBrowserLoadableUrl("poster", poster);
                sitePropertyService.setValue(SiteProperty.KEY_VEHICLES_HERO_POSTER, poster);
            }
        }
        return getVehiclesHero();
    }

    private static String asTrimmedString(Object raw) {
        if (raw == null) {
            return "";
        }
        return String.valueOf(raw).trim();
    }

    /**
     * Pages are served over http(s). Browsers refuse {@code file://} and Windows drive paths become {@code file://}, so they never work as {@code <video src>} from localhost.
     */
    private static void assertBrowserLoadableUrl(String field, String url) {
        if (url == null || url.isBlank()) {
            return;
        }
        String u = url.trim();
        if (u.regionMatches(true, 0, "file:", 0, 5)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + ": file:// URLs cannot be used from a web page. Put files under static/hero-assets/ and use http://localhost:PORT/hero-assets/name.mp4, or use https:// on a real host.");
        }
        if (u.length() >= 3
                && Character.isLetter(u.charAt(0))
                && u.charAt(1) == ':'
                && (u.charAt(2) == '/' || u.charAt(2) == '\\')) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    field + ": Windows paths (G:\\...) are not valid web URLs. Copy the file to src/main/resources/static/hero-assets/ and use e.g. http://localhost:8080/hero-assets/yourfile.mp4");
        }
    }

    public record VehiclesHeroResponse(String mp4, String poster) {
    }
}
