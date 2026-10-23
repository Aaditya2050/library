package com.recall.app.dto.response;

import com.recall.app.entity.Note.SourceType;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NoteResponse {
    private Long id;
    private String title;
    private String content;
    private String simpleMeaning;
    private String example;
    private String whyItMatters;
    private String sourceUrl;
    private SourceType sourceType;
    private String sourceTitle;
    private String sourceReference;
    private Boolean isFavorite;
    private Boolean reviewEnabled;
    private Long sectionId;
    private String sectionName;
    private String sectionIcon;
    private String sectionAccentColor;
    private Set<TagResponse> tags;
    private Set<NoteStubResponse> relatedNotes;
    private ReviewScheduleResponse reviewSchedule;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
