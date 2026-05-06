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
import com.cookquest.profile.entity.Level;
import com.cookquest.profile.entity.UserProfile;
import com.cookquest.profile.repository.LevelRepository;
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
    private final LevelRepository levelRepository;


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

        // 1. Дістаємо 1-й рівень з БД
        Level defaultLevel = levelRepository.findByLevelNumber(1)
                .orElseThrow(() -> new AppException(
                        ErrorCode.INTERNAL_ERROR,
                        "Критична помилка: Базовий рівень (1) не знайдено в БД",
                        HttpStatus.INTERNAL_SERVER_ERROR
                ));

        // 2. Дістаємо стартового маскота за його унікальним ключем
        Mascot starterMascot = mascotRepository.findByName("MASCOT_BROCCOLI")
                .orElseThrow(() -> new AppException(
                        ErrorCode.INTERNAL_ERROR,
                        "Критична помилка: Стартовий маскот не знайдений у БД",
                        HttpStatus.INTERNAL_SERVER_ERROR
                ));

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        // 3. Збираємо профіль з правильними сутностями
        UserProfile profile = UserProfile.builder()
                .user(user)
                .xp(0)
                .level(defaultLevel) // Передаємо сутність Level, а не просто цифру 1
                .balance(0)
                .ratingScore(0)
                .language(Language.UK)
                .activeMascotId(starterMascot.getId()) // Беремо ID знайденого Броколі
                .build();

        user.setProfile(profile);
        userRepository.save(user);

        // 4. Додаємо стартового маскота в інвентар юзера
        UserMascot userMascot = UserMascot.builder()
                .userId(user.getId())
                .mascot(starterMascot)
                .acquiredAt(LocalDateTime.now())
                .build();

        userMascotRepository.save(userMascot);

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

            if (!(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
                throw new AppException(
                        ErrorCode.USER_NOT_FOUND,
                        "Помилка авторизації: невірний тип Principal",
                        HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            User user = userDetails.getUser();

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