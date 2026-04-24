package com.cookquest.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        // 1. Дозволяємо запити саме з нашого React-додатка
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        // 2. Дозволяємо всі заголовки (це важливо для передачі Authorization: Bearer <token>)
        config.setAllowedHeaders(List.of("*"));

        // 3. Дозволяємо всі HTTP-методи
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // 4. Дозволяємо браузеру читати відповіді (для роботи токенів)
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Застосовуємо ці правила абсолютно до всіх шляхів у нашому API (/**)
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}