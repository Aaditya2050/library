package com.recall.app.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private LocalDateTime createdAt;
}
