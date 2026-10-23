package com.recall.app.controller;

import com.recall.app.dto.response.TagResponse;
import com.recall.app.entity.Tag;
import com.recall.app.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagRepository tagRepository;

    @GetMapping
    public ResponseEntity<List<TagResponse>> getTags(@AuthenticationPrincipal Long userId) {
        List<TagResponse> tags = tagRepository.findByUserIdOrderByNameAsc(userId)
            .stream()
            .map(t -> TagResponse.builder().id(t.getId()).name(t.getName()).createdAt(t.getCreatedAt()).build())
            .collect(Collectors.toList());
        return ResponseEntity.ok(tags);
    }
}
