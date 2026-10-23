package com.recall.app.controller;

import com.recall.app.dto.request.SectionRequest;
import com.recall.app.dto.response.SectionResponse;
import com.recall.app.service.impl.SectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
public class SectionController {

    private final SectionService sectionService;

    @GetMapping
    public ResponseEntity<List<SectionResponse>> getSections(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(sectionService.getUserSections(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SectionResponse> getSection(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ResponseEntity.ok(sectionService.getSection(userId, id));
    }

    @PostMapping
    public ResponseEntity<SectionResponse> createSection(@AuthenticationPrincipal Long userId,
                                                          @Valid @RequestBody SectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sectionService.createSection(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SectionResponse> updateSection(@AuthenticationPrincipal Long userId,
                                                          @PathVariable Long id,
                                                          @Valid @RequestBody SectionRequest request) {
        return ResponseEntity.ok(sectionService.updateSection(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        sectionService.deleteSection(userId, id);
        return ResponseEntity.noContent().build();
    }
}
