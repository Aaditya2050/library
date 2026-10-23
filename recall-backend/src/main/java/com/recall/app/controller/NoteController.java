package com.recall.app.controller;

import com.recall.app.dto.request.NoteRequest;
import com.recall.app.dto.response.NoteResponse;
import com.recall.app.service.impl.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<Page<NoteResponse>> getNotes(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(noteService.getUserNotes(userId, page, size));
    }

    @GetMapping("/section/{sectionId}")
    public ResponseEntity<Page<NoteResponse>> getSectionNotes(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long sectionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(noteService.getSectionNotes(userId, sectionId, page, size));
    }

    @GetMapping("/favorites")
    public ResponseEntity<Page<NoteResponse>> getFavorites(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(noteService.getFavorites(userId, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<NoteResponse>> searchNotes(
            @AuthenticationPrincipal Long userId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(noteService.searchNotes(userId, q, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(noteService.getNote(userId, id));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.createNote(userId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        return ResponseEntity.ok(noteService.updateNote(userId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        noteService.deleteNote(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<NoteResponse> toggleFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(noteService.toggleFavorite(userId, id));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<NoteResponse> duplicateNote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteService.duplicateNote(userId, id));
    }
}
