package com.recall.app.controller;

import com.recall.app.dto.request.ReviewRatingRequest;
import com.recall.app.dto.response.ReviewScheduleResponse;
import com.recall.app.service.impl.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/due")
    public ResponseEntity<List<ReviewScheduleResponse>> getDueReviews(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(reviewService.getDueReviews(userId));
    }

    @GetMapping("/due/count")
    public ResponseEntity<Map<String, Long>> getDueCount(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(Map.of("count", reviewService.getDueCount(userId)));
    }

    @PostMapping("/notes/{noteId}/enable")
    public ResponseEntity<ReviewScheduleResponse> enableReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long noteId) {
        return ResponseEntity.ok(reviewService.enableReview(userId, noteId));
    }

    @PostMapping("/notes/{noteId}/rate")
    public ResponseEntity<ReviewScheduleResponse> submitReview(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long noteId,
            @RequestBody ReviewRatingRequest request) {
        return ResponseEntity.ok(reviewService.submitReview(userId, noteId, request.getRating()));
    }
}
