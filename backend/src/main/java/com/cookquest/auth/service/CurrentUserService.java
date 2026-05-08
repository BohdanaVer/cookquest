package com.cookquest.auth.service;

import com.cookquest.auth.entity.CustomUserDetails;
import com.cookquest.auth.entity.User;
import com.cookquest.common.exception.AppException;
import com.cookquest.common.exception.ErrorCode;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    public User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUser();
        }
        throw new AppException(ErrorCode.UNAUTHORIZED_ACCESS, "Користувач не авторизований", org.springframework.http.HttpStatus.UNAUTHORIZED);
    }
}
