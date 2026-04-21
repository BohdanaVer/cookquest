package com.cookquest.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Slf4j // Автоматично створює змінну log для логування
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Перехоплюємо НАШІ бізнес-помилки
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
        // Логуємо: якщо помилка сервера (500) - як ERROR, інакше як WARN
        if (ex.getHttpStatus().is5xxServerError()) {
            log.error("Внутрішня помилка [{}]: {}", ex.getErrorCode(), ex.getMessage(), ex);
        } else {
            log.warn("Бізнес-помилка [{}]: {}", ex.getErrorCode(), ex.getMessage());
        }

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(ex.getHttpStatus().value())
                .errorCode(ex.getErrorCode().name())
                .message(ex.getMessage()) // Це повідомлення побачить фронтенд
                .build();

        return new ResponseEntity<>(response, ex.getHttpStatus());
    }

    // 2. Перехоплюємо будь-які НЕОЧІКУВАНІ збої (наприклад NullPointerException)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Неочікуваний системний збій!", ex); // Логуємо повний стектрейс

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(500)
                .errorCode(ErrorCode.INTERNAL_SERVER_ERROR.name())
                .message("Щось пішло не так на сервері. Ми вже працюємо над цим.")
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);

    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {

        // Збираємо всі помилки валідації в один рядок.
        // Наприклад: "password: не може бути порожнім, email: має бути коректним"
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        log.warn("Помилка валідації: {}", errorMessage);

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value()) // Статус 400
                .errorCode(ErrorCode.VALIDATION_ERROR.name()) // Використовуємо твій Enum!
                .message(errorMessage)
                .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
}


/* приклад

package com.cookquest.user.service;

import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    public void registerUser(String email) {
        boolean emailExists = true; // Уявимо, що ми знайшли емейл в БД

        if (emailExists) {
            // Просто кидаємо помилку. Логер в GlobalExceptionHandler сам її запише!
            throw new AppException(
                ErrorCode.EMAIL_ALREADY_EXISTS,
                "Користувач з таким email вже існує",
                HttpStatus.CONFLICT // 409 статус
            );
        }
    }
}
 */