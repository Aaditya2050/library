package com.recall.app.service.impl;

import com.recall.app.dto.request.LoginRequest;
import com.recall.app.dto.request.RegisterRequest;
import com.recall.app.dto.response.AuthResponse;
import com.recall.app.dto.response.UserDTO;
import com.recall.app.entity.User;
import com.recall.app.exception.BadRequestException;
import com.recall.app.exception.ResourceNotFoundException;
import com.recall.app.repository.UserRepository;
import com.recall.app.security.JwtTokenProvider;
import com.recall.app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with that email already exists");
        }

        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getId());
        return buildAuthResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtTokenProvider.generateToken(user.getId());
        return buildAuthResponse(user, token);
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        UserDTO userDto = UserDTO.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .avatarUrl(user.getAvatarUrl())
            .createdAt(user.getCreatedAt())
            .build();

        return AuthResponse.builder()
            .token(token)
            .tokenType("Bearer")
            .user(userDto)
            .expiresAt(LocalDateTime.now().plusDays(1))
            .build();
    }
}
