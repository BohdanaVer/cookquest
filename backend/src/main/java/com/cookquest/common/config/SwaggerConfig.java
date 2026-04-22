package com.cookquest.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                // 1. Заголовок твоєї документації
                .info(new Info().title("CookQuest API").version("1.0"))

                // 2. Кажемо: "Застосувати це правило безпеки до ВСІХ ендпоінтів"
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))

                // 3. Пояснюємо Swagger'у, ЯКЕ САМЕ це правило (що це HTTP Bearer токен типу JWT)
                .components(
                        new Components()
                                .addSecuritySchemes(securitySchemeName,
                                        new SecurityScheme()
                                                .name(securitySchemeName)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );
    }
}