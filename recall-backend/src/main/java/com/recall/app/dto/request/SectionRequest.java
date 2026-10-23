package com.recall.app.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SectionRequest {
    @NotBlank(message = "Section name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 1000)
    private String description;

    @Size(max = 50)
    private String icon = "BookOpen";

    @Size(max = 20)
    private String accentColor = "#6366f1";

    private Integer displayOrder;
}
