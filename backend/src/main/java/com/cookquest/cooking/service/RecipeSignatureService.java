package com.cookquest.cooking.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
public class RecipeSignatureService {

    // Секретний ключ (його ніхто не знає, крім сервера)
    @Value("${app.security.recipe-secret:cookquest-super-secret-key-2026}")
    private String secretKey;

    private static final String ALGORITHM = "HmacSHA256";

    // Генерує підпис
    public String generateSignature(String data) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), ALGORITHM);
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Помилка генерації підпису", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Перевіряє підпис і кидає помилку, якщо щось не так
    public void verifySignatureOrThrow(String data, String providedSignature) {
        if (providedSignature == null || providedSignature.isBlank()) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Відсутній підпис рецепта", HttpStatus.FORBIDDEN);
        }

        String calculatedSignature = generateSignature(data);
        if (!calculatedSignature.equals(providedSignature)) {
            throw new AppException(ErrorCode.SECURITY_VIOLATION, "Виявлено підробку рецепта! Підпис недійсний.", HttpStatus.FORBIDDEN);
        }
    }
}