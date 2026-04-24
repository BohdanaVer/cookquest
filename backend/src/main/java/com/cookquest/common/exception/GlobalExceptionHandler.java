package com.cookquest.common.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
        if (ex.getHttpStatus().is5xxServerError()) {
            log.error("Внутрішня помилка [{}]: {}", ex.getErrorCode(), ex.getMessage(), ex);
        } else {
            log.warn("Бізнес-помилка [{}]: {}", ex.getErrorCode(), ex.getMessage());
        }

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(ex.getHttpStatus().value())
                .errorCode(ex.getErrorCode().name())
                .message(ex.getMessage())
                .build();

        return new ResponseEntity<>(response, ex.getHttpStatus());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Неочікуваний системний збій!", ex);

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(500)
                .errorCode(ErrorCode.INTERNAL_SERVER_ERROR.name())
                .message("Щось пішло не так на сервері. Ми вже працюємо над цим.")
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);

    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .errorCode(ErrorCode.VALIDATION_ERROR.name())
                .message("Validation failed for one or more fields")
                .validationErrors(errors)
                .build();

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
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