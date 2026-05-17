package com.example.demo.controller;

import com.example.demo.dto.AuthDto;
import com.example.demo.dto.AuthDto.AuthUserResponse;
import com.example.demo.dto.AuthDto.UserProfileResponse;
import com.example.demo.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthUserResponse register(@RequestBody AuthDto.RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthUserResponse login(@RequestBody AuthDto.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/users")
    public List<AuthUserResponse> getUsers() {
        return authService.listUsers();
    }

    @GetMapping("/profile/{userId}")
    public UserProfileResponse getUserProfile(@PathVariable Long userId) {
        return authService.getUserProfile(userId);
    }

    @PutMapping("/profile/{userId}/photo")
    public AuthUserResponse updateProfilePhoto(
            @PathVariable Long userId,
            @RequestBody AuthDto.ProfilePhotoRequest request
    ) {
        return authService.updateProfilePhoto(userId, request);
    }

    @PutMapping("/profile/{userId}")
    public AuthUserResponse updateProfile(
            @PathVariable Long userId,
            @RequestBody AuthDto.UpdateProfileRequest request
    ) {
        return authService.updateProfile(userId, request);
    }

    @PutMapping("/profile/{userId}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updatePassword(
            @PathVariable Long userId,
            @RequestBody AuthDto.UpdatePasswordRequest request
    ) {
        authService.updatePassword(userId, request);
    }
}
