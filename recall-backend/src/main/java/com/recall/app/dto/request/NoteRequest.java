package com.recall.app.dto.request;

import com.recall.app.entity.Note.SourceType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.HashSet;
import java.util.Set;

@Data
public class NoteRequest {
    @NotBlank(message = "Title is required")
    @Size(max = 500)
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private String simpleMeaning;
    private String example;
    private String whyItMatters;

    @Size(max = 1000)
    private String sourceUrl;

    private SourceType sourceType = SourceType.PERSONAL;

    @Size(max = 500)
    private String sourceTitle;

    @Size(max = 200)
    private String sourceReference;

    private Long sectionId;

    private Set<String> tags = new HashSet<>();
    private Set<Long> relatedNoteIds = new HashSet<>();

    private Boolean isFavorite = false;
    private Boolean reviewEnabled = false;
}
