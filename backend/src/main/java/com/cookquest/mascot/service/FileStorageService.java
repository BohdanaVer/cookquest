package com.cookquest.mascot.service;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final Cloudinary cloudinary;

    public String saveImageToCloud(byte[] imageBytes, String folder, String fileName) throws IOException {
        Map<String, Object> params = new HashMap<>();

        params.put("folder", folder);

        params.put("public_id", fileName);

        Map uploadResult = cloudinary.uploader().upload(imageBytes, params);

        String secureUrl = uploadResult.get("secure_url").toString();
        log.info("Файл успішно завантажено в Cloudinary: {}", secureUrl);

        return secureUrl;
    }
}