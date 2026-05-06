package com.cookquest.common.ai;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class GroqClient {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model.text:llama-3.3-70b-versatile}")
    private String textModel;

    @Value("${groq.model.vision:llama-3.2-11b-vision-preview}")
    private String visionModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public String sendTextRequest(String formattedMessagesArray) {
        try {
            JsonNode messages = objectMapper.readTree(formattedMessagesArray);
            return executeWithRetry(textModel, messages, 7000, 0.7, true);
        } catch (Exception e) {
            throw new AppException(
                    ErrorCode.INVALID_REQUEST,
                    "Помилка парсингу JSON для тексту",
                    HttpStatus.BAD_REQUEST);
        }
    }

    public String sendVisionRequest(List<String> imageUrls, String textPrompt) {
        ArrayNode contentArray = objectMapper.createArrayNode();

        ObjectNode textNode = objectMapper.createObjectNode();
        textNode.put("type", "text");
        textNode.put("text", textPrompt);
        contentArray.add(textNode);

        for (String url : imageUrls) {
            ObjectNode imageNode = objectMapper.createObjectNode();
            imageNode.put("type", "image_url");

            ObjectNode urlNode = objectMapper.createObjectNode();
            urlNode.put("url", url);

            imageNode.set("image_url", urlNode);
            contentArray.add(imageNode);
        }

        ArrayNode messagesArray = objectMapper.createArrayNode();
        ObjectNode messageNode = objectMapper.createObjectNode();
        messageNode.put("role", "user");
        messageNode.set("content", contentArray);
        messagesArray.add(messageNode);

        return executeWithRetry(visionModel, messagesArray, 1024, 0.1, false);
    }

    private String executeWithRetry(String model, JsonNode messagesArray, int maxTokens, double temperature, boolean useJsonMode) {
        ObjectNode payloadNode = objectMapper.createObjectNode();
        payloadNode.put("model", model);
        payloadNode.set("messages", messagesArray);
        payloadNode.put("temperature", temperature);
        payloadNode.put("max_tokens", maxTokens);

        if (useJsonMode) {
            ObjectNode formatNode = objectMapper.createObjectNode();
            formatNode.put("type", "json_object");
            payloadNode.set("response_format", formatNode);
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(payloadNode);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Помилка формування JSON", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(payload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    String content = root.path("choices").get(0).path("message").path("content").asText();
                    return extractCleanJson(content);
                } else if (response.statusCode() == 400) {
                    log.error("Groq API 400 Error: {}", response.body());
                    throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Groq відхилив запит (400): " + response.body(), HttpStatus.BAD_REQUEST);
                } else if (response.statusCode() >= 500 || response.statusCode() == 429) {
                    log.warn("Groq API {} error, attempt {}. Retrying...", response.statusCode(), attempt + 1);
                    if (attempt == 1) throw new Exception("API error " + response.statusCode());
                } else {
                    throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Невідома помилка Groq: " + response.body(), HttpStatus.BAD_REQUEST);
                }
            } catch (AppException ae) {
                throw ae;
            } catch (Exception e) {
                if (attempt == 1) {
                    throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Groq API не відповідає: " + e.getMessage(), HttpStatus.SERVICE_UNAVAILABLE);
                }
            }
        }

        throw new AppException(ErrorCode.EXTERNAL_API_ERROR, "Сервіс ШІ тимчасово недоступний.", HttpStatus.SERVICE_UNAVAILABLE);
    }

    private String extractCleanJson(String rawContent) {
        if (rawContent == null) return "{}";
        return rawContent
                .replaceAll("(?i)^```json\\s*", "")
                .replaceAll("^```\\s*", "")
                .replaceAll("\\s*```$", "")
                .trim();
    }

    public String sendVisionRequestRaw(String formattedMessagesArray) {
        try {
            // Перетворюємо стрічку з промптом на JsonNode, як того вимагає твій executeWithRetry
            JsonNode messagesNode = objectMapper.readTree(formattedMessagesArray);

            // Відправляємо запит. Зверни увагу: останній параметр false, бо Vision не підтримує JSON_OBJECT
            return executeWithRetry(visionModel, messagesNode, 512, 0.2, false);

        } catch (Exception e) {
            log.error("Помилка парсингу промпту", e);
            throw new AppException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    "Внутрішня помилка формування запиту до ШІ",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Перекладає текст на англійську для стабільної генерації зображень.
     * Якщо текст порожній, або API недоступне, безпечно повертає оригінальний текст.
     */
    public String translateToEnglish(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        try {
            ArrayNode messagesArray = objectMapper.createArrayNode();

            // Системний промпт: жорстко вимагаємо лише переклад
            ObjectNode systemMessage = objectMapper.createObjectNode();
            systemMessage.put("role", "system");
            systemMessage.put("content",
                    "You are an expert prompt engineer for an AI mascot generator. " +
                            "Translate the user's Ukrainian text into English. " +
                            "CRITICAL RULES: " +
                            "1. Extract ONLY physical attributes, clothing, accessories, emotions, and held items. " +
                            "2. COMPLETELY REMOVE any mentions of backgrounds, rooms, furniture, environments, or spatial actions (e.g., 'sitting at a table', 'flying in space', 'in a kitchen'). " +
                            "3. If the user mentions interacting with a large object, convert it to holding a small version (e.g., 'playing on computer' -> 'holding a laptop'). " +
                            "Respond ONLY with the final sanitized English phrase. No explanations."
            );
            messagesArray.add(systemMessage);

            ObjectNode userMessage = objectMapper.createObjectNode();
            userMessage.put("role", "user");
            userMessage.put("content", text);
            messagesArray.add(userMessage);

            // Викликаємо executeWithRetry:
            String translated = executeWithRetry(textModel, messagesArray, 150, 0.1, false);

            String cleanTranslation = translated.trim();

            // ДОДАНО ЛОГУВАННЯ: Виводимо результат перекладу в консоль
            log.info("Groq переклад: [{}] -> [{}]", text, cleanTranslation);

            return cleanTranslation;

        } catch (Exception e) {
            log.warn("Не вдалося перекласти текст [{}]. Використовуємо оригінал. Причина: {}", text, e.getMessage());
            return text;
        }
    }
}