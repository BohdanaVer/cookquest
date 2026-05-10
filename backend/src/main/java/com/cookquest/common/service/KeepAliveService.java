package com.cookquest.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@EnableScheduling
public class KeepAliveService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.public-url:https://cookquest-backend.onrender.com}")
    private String publicUrl;

    @Scheduled(fixedRate = 240000)
    public void ping() {
        try {
            String url = publicUrl + "/api/ping";
            String response = restTemplate.getForObject(url, String.class);
            log.info("Keep-alive ping sent to {}. Response: {}", url, response);
        } catch (Exception e) {
            log.error("Failed to send keep-alive ping", e);
        }
    }
}