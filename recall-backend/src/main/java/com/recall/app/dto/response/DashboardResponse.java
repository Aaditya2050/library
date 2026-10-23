package com.recall.app.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private long totalNotes;
    private long totalSections;
    private long favoriteNotes;
    private long dueReviews;
    private java.util.List<NoteResponse> recentNotes;
    private java.util.List<NoteResponse> favoriteNotes2;
    private java.util.List<SectionResponse> sections;
}
