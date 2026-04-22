package com.cookquest.user.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.common.security.JwtService;
import com.cookquest.user.dto.AuthResponse;
import com.cookquest.user.dto.LoginRequest;
import com.cookquest.user.dto.RegisterRequest;
import com.cookquest.user.entity.Role;
import com.cookquest.user.entity.User;
import com.cookquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(
                    ErrorCode.EMAIL_ALREADY_EXISTS,
                    "Користувач з таким email вже зареєстрований",
                    HttpStatus.CONFLICT
            );
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);
        return buildResponse(user, jwtToken);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            if (!(authentication.getPrincipal() instanceof User user)) {
                throw new AppException(
                        ErrorCode.USER_NOT_FOUND,
                        "Користувача не знайдено",
                        HttpStatus.NOT_FOUND
                );
            }

            String jwtToken = jwtService.generateToken(user);

            return buildResponse(user, jwtToken);

        } catch (BadCredentialsException e) {
            throw new AppException(
                    ErrorCode.BAD_CREDENTIALS,
                    "Невірний email або пароль",
                    HttpStatus.UNAUTHORIZED
            );
        }
    }

    private AuthResponse buildResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}