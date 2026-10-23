package com.recall.app.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TagResponse {
    private Long id;
    private String name;
    private LocalDateTime createdAt;
}
