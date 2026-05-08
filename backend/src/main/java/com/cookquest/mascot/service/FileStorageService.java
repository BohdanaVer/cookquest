package com.cookquest.mascot.service;

import com.cloudinary.Cloudinary;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final Cloudinary cloudinary;

    public String saveImageToCloud(byte[] imageBytes, String folder, String fileName) {
        try {
            Map<String, Object> params = new HashMap<>();
            params.put("folder", folder);
            params.put("public_id", fileName);

            Map uploadResult = cloudinary.uploader().upload(imageBytes, params);

            String secureUrl = uploadResult.get("secure_url").toString();
            log.info("Файл успішно завантажено в Cloudinary: {}", secureUrl);

            return secureUrl;
        } catch (IOException e) {
            log.error("Помилка завантаження файлу в Cloudinary", e);
            throw new AppException(ErrorCode.CLOUD_STORAGE_ERROR, "Не вдалося зберегти зображення у хмару", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
}