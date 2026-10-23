package com.recall.app.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewScheduleResponse {
    private Long id;
    private Long noteId;
    private String noteTitle;
    private LocalDate nextReviewAt;
    private Integer intervalDays;
    private Double easeFactor;
    private Integer repetitions;
    private LocalDateTime updatedAt;
}
