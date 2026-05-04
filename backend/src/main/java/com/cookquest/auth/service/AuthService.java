package com.cookquest.auth.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.cookquest.common.security.JwtService;
import com.cookquest.auth.dto.AuthResponse;
import com.cookquest.auth.dto.LoginRequest;
import com.cookquest.auth.dto.RegisterRequest;
import com.cookquest.auth.entity.Role;
import com.cookquest.auth.entity.User;
import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.repository.UserRepository;
import com.cookquest.mascot.entity.Mascot;
import com.cookquest.mascot.entity.UserMascot;
import com.cookquest.mascot.repository.MascotRepository;
import com.cookquest.mascot.repository.UserMascotRepository;
import com.cookquest.profile.entity.Language;
import com.cookquest.profile.entity.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final MascotRepository mascotRepository;
    private final UserMascotRepository userMascotRepository;

    private static final Long STARTER_MASCOT_ID = 1L;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(
                    ErrorCode.EMAIL_ALREADY_EXISTS,
                    "Користувач з таким email вже зареєстрований",
                    HttpStatus.CONFLICT
            );
        }

        if (userRepository.existsByUsername(request.username())) {
            throw new AppException(
                    ErrorCode.USERNAME_ALREADY_EXISTS,
                    "Користувач з таким іменем вже зареєстрований",
                    HttpStatus.CONFLICT
            );
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .xp(0)
                .level(1)
                .balance(0)
                .ratingScore(0)
                .language(Language.UK)
                .activeMascotId(STARTER_MASCOT_ID)
                .build();

        user.setProfile(profile);

        userRepository.save(user);

        // Видаємо стартового маскота новому юзеру
        mascotRepository.findById(STARTER_MASCOT_ID).ifPresent(starterMascot -> {
            UserMascot userMascot = UserMascot.builder()
                    .userId(user.getId())
                    .mascot(starterMascot)
                    .acquiredAt(LocalDateTime.now())
                    .build();
            userMascotRepository.save(userMascot);
        });

        CustomUserDetails userDetails = new CustomUserDetails(user);

        String jwtToken = jwtService.generateToken(userDetails);

        return buildResponse(user, jwtToken);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );

            // 1. ТЕПЕР МИ ПЕРЕВІРЯЄМО НА CustomUserDetails
            if (!(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
                throw new AppException(
                        ErrorCode.USER_NOT_FOUND,
                        "Помилка авторизації: невірний тип Principal",
                        HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            // 2. Дістаємо нашого юзера для відповіді
            User user = userDetails.getUser();

            // 3. Генеруємо токен
            String jwtToken = jwtService.generateToken(userDetails);

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