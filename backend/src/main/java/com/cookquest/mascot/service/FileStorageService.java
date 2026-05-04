package com.cookquest.mascot.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;


import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String UPLOAD_DIR = "uploads/";

    public FileStorageService() {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    public String saveBase64Image(String base64Image) {
        try {
            // Remove the data url prefix if it exists
            String base64Data = base64Image.replaceFirst("^data:image/[^;]+;base64,", "");
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);

            String fileName = "mascot_" + UUID.randomUUID() + ".png";
            Path filePath = Paths.get(UPLOAD_DIR, fileName);

            Files.write(filePath, imageBytes);

            return "/uploads/" + fileName; // Return relative URL
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Помилка збереження файлу", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
