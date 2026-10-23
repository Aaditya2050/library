package com.recall.app.service;

import com.recall.app.dto.request.LoginRequest;
import com.recall.app.dto.request.RegisterRequest;
import com.recall.app.dto.response.AuthResponse;
import com.recall.app.entity.User;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    User getCurrentUser(Long userId);
}
