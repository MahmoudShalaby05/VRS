package com.example.demo.service;

import com.example.demo.dto.AuthDto;
import com.example.demo.dto.AuthDto.AuthUserResponse;
import com.example.demo.dto.AuthDto.BookingHistoryResponse;
import com.example.demo.dto.AuthDto.DamageReportResponse;
import com.example.demo.dto.AuthDto.UserProfileResponse;
import com.example.demo.model.AppUser;
import com.example.demo.repository.AppUserRepository;
import com.example.demo.repository.UserDamageReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final BookingService bookingService;
    private final UserDamageReportRepository userDamageReportRepository;

    public AuthService(
            AppUserRepository appUserRepository,
            BookingService bookingService,
            UserDamageReportRepository userDamageReportRepository
    ) {
        this.appUserRepository = appUserRepository;
        this.bookingService = bookingService;
        this.userDamageReportRepository = userDamageReportRepository;
    }

    @Transactional
    public AuthUserResponse register(AuthDto.RegisterRequest request) {
        String email = normalizeEmail(request.email());

        if (request.name() == null || request.name().isBlank()
                || email.isEmpty()
                || request.phone() == null || request.phone().isBlank()
                || request.password() == null || request.password().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All fields are required");
        }

        if (appUserRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone().trim());
        user.setPassword(request.password());
        user.setCreatedAt(LocalDateTime.now());

        return AuthUserResponse.from(appUserRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthUserResponse login(AuthDto.LoginRequest request) {
        String email = normalizeEmail(request.email());

        if (email.isEmpty() || request.password() == null || request.password().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!user.getPassword().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return AuthUserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public List<AuthUserResponse> listUsers() {
        return appUserRepository.findAll().stream().map(AuthUserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<BookingHistoryResponse> bookings = bookingService.findForUserProfile(userId)
                .stream()
                .map(BookingHistoryResponse::from)
                .toList();

        List<DamageReportResponse> damageReports = userDamageReportRepository.findByUserIdForProfile(userId)
                .stream()
                .map(DamageReportResponse::from)
                .toList();

        return new UserProfileResponse(AuthUserResponse.from(user), bookings, damageReports);
    }

    @Transactional
    public AuthUserResponse updateProfilePhoto(Long userId, AuthDto.ProfilePhotoRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setProfileImageUrl(request.imageUrl() == null ? "" : request.imageUrl());
        return AuthUserResponse.from(appUserRepository.save(user));
    }

    @Transactional
    public AuthUserResponse updateProfile(Long userId, AuthDto.UpdateProfileRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String nextEmail = normalizeEmail(request.email());
        if (request.name() == null || request.name().isBlank()
                || nextEmail.isEmpty()
                || request.phone() == null || request.phone().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, email and phone are required");
        }

        if (!nextEmail.equals(user.getEmail()) && appUserRepository.existsByEmail(nextEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        user.setName(request.name().trim());
        user.setEmail(nextEmail);
        user.setPhone(request.phone().trim());

        return AuthUserResponse.from(appUserRepository.save(user));
    }

    @Transactional
    public void updatePassword(Long userId, AuthDto.UpdatePasswordRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.currentPassword() == null || request.currentPassword().isBlank()
                || request.newPassword() == null || request.newPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current and new passwords are required");
        }

        if (!user.getPassword().equals(request.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        if (request.newPassword().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters");
        }

        user.setPassword(request.newPassword());
        appUserRepository.save(user);
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
