package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

@RestController
public class TestController {

    @GetMapping("/api")
    public String home() {
        return "Spring Boot is working!";
    }

    @GetMapping("/vehicles")
    public RedirectView vehiclesPage() {
        return new RedirectView("/vehicles.html");
    }
}