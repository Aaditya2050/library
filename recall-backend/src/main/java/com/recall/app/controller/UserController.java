package com.recall.app.controller;

import com.recall.app.entity.User;
import com.recall.app.exception.BadRequestException;
import com.recall.app.repository.UserRepository;
import com.recall.app.service.AuthService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(@AuthenticationPrincipal Long userId) {
        User user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "createdAt", user.getCreatedAt()
        ));
    }

    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateMe(
            @AuthenticationPrincipal Long userId,
            @RequestBody UpdateProfileRequest req) {
        User user = authService.getCurrentUser(userId);
        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail()));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal Long userId,
            @RequestBody ChangePasswordRequest req) {
        User user = authService.getCurrentUser(userId);
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal Long userId) {
        userRepository.deleteById(userId);
        return ResponseEntity.noContent().build();
    }

    @Data
    static class UpdateProfileRequest {
        private String name;
    }

    @Data
    static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
    }
}
