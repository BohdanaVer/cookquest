package com.cookquest.common.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class WebConfig {

    @Bean
    public ObjectMapper objectMapper() {
        // Тут ми можемо його налаштувати, якщо знадобиться в майбутньому.
        // Spring візьме цей об'єкт і покладе у свій контекст (ApplicationContext).
        return new ObjectMapper();
    }
}