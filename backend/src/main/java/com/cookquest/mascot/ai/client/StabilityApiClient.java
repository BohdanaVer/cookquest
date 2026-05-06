package com.cookquest.mascot.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@Component
public class StabilityApiClient {

    @Value("${stability.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GENERATE_URL = "https://api.stability.ai/v2beta/stable-image/generate/core";
    private static final String REMOVE_BG_URL = "https://api.stability.ai/v2beta/stable-image/edit/remove-background";

    public byte[] generateImage(String prompt, String negativePrompt, String stylePreset) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(apiKey);
        headers.set("Accept", "application/json");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("prompt", prompt);
        body.add("output_format", "png");
        body.add("negative_prompt", negativePrompt);
        body.add("style_preset", stylePreset);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(GENERATE_URL, requestEntity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String base64Image = rootNode.path("image").asText();
            return Base64.getDecoder().decode(base64Image);
        } catch (Exception e) {
            throw new RuntimeException("Stability API Generation Error: " + e.getMessage());
        }
    }

    public byte[] removeBackground(byte[] imageBytes) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(apiKey);
        headers.set("Accept", "application/json");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("output_format", "png");

        ByteArrayResource imageResource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() { return "mascot.png"; }
        };
        body.add("image", imageResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(REMOVE_BG_URL, requestEntity, String.class);
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            String base64Image = rootNode.path("image").asText();
            return Base64.getDecoder().decode(base64Image);
        } catch (Exception e) {
            System.err.println("Remove Background failed, returning original image: " + e.getMessage());
            return imageBytes;
        }
    }
}
