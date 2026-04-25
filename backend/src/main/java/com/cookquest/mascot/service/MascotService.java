package com.cookquest.mascot.service;

import com.cookquest.mascot.ai.client.StabilityApiClient;
import com.cookquest.mascot.dto.MascotConfig;
import com.cookquest.mascot.dto.MascotResponse;
import com.cookquest.mascot.ai.prompt.MascotPromptBuilder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
@RequiredArgsConstructor
public class MascotService {

    private final MascotPromptBuilder promptBuilder;
    private final StabilityApiClient stabilityClient;

    public MascotResponse generateMascot(MascotConfig config) {
        try {
            // 1. Будуємо промпти
            var promptData = promptBuilder.buildPrompt(config);

            // 2. Генерація (Крок 1)
            byte[] generatedImage = stabilityClient.generateImage(
                    promptData.prompt(),
                    promptData.negativePrompt(),
                    promptData.stylePreset()
            );

            // 3. Видалення фону (Крок 2)
            byte[] finalTransparentImage = stabilityClient.removeBackground(generatedImage);

            // 4. Конвертація в Data URL для фронтенду (Крок 3)
            String base64Str = Base64.getEncoder().encodeToString(finalTransparentImage);
            String dataUrl = "data:image/png;base64," + base64Str;

            return new MascotResponse(true, dataUrl, promptData.prompt(), null);

        } catch (Exception e) {
            return new MascotResponse(false, null, null, "Помилка генерації: " + e.getMessage());
        }
    }
}