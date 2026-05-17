package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

/**
 * Root redirects and health-style endpoints (replaces legacy TestController).
 */
@RestController
public class RootRedirectController {

    @GetMapping("/api")
    public String apiHealth() {
        return "DriveRed API is running";
    }

    @GetMapping("/vehicles")
    public RedirectView vehiclesPage() {
        return new RedirectView("/vehicles.html");
    }
}
