package com.recall.app.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SectionResponse {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private String accentColor;
    private Integer displayOrder;
    private long noteCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
