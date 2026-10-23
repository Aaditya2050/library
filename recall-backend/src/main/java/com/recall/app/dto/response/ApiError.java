package com.recall.app.dto.response;

import lombok.*;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApiError {
    private int status;
    private String error;
    private String message;
    private Map<String, String> fieldErrors;
    private long timestamp;

    public static ApiError of(int status, String error, String message) {
        return ApiError.builder()
            .status(status)
            .error(error)
            .message(message)
            .timestamp(System.currentTimeMillis())
            .build();
    }
}
