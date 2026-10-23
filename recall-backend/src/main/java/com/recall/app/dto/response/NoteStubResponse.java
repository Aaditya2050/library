package com.recall.app.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NoteStubResponse {
    private Long id;
    private String title;
    private String sectionName;
    private String sectionIcon;
    private String sectionAccentColor;
}
