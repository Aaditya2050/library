package com.recall.app.service.impl;

import com.recall.app.dto.request.NoteRequest;
import com.recall.app.dto.response.*;
import com.recall.app.entity.*;
import com.recall.app.exception.ResourceNotFoundException;
import com.recall.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final SectionRepository sectionRepository;
    private final TagRepository tagRepository;

    @Transactional(readOnly = true)
    public Page<NoteResponse> getUserNotes(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return noteRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NoteResponse> getSectionNotes(Long userId, Long sectionId, int page, int size) {
        sectionRepository.findByIdAndUserId(sectionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return noteRepository.findByUserIdAndSectionIdOrderByCreatedAtDesc(userId, sectionId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NoteResponse> getFavorites(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return noteRepository.findByUserIdAndIsFavoriteTrueOrderByUpdatedAtDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NoteResponse> searchNotes(Long userId, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return noteRepository.searchByText(userId, query, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public NoteResponse getNote(Long userId, Long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        return toResponse(note);
    }

    @Transactional
    public NoteResponse createNote(Long userId, NoteRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Section section = null;
        if (request.getSectionId() != null) {
            section = sectionRepository.findByIdAndUserId(request.getSectionId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        }

        Set<Tag> tags = resolveOrCreateTags(userId, user, request.getTags());

        Note note = Note.builder()
            .user(user)
            .section(section)
            .title(request.getTitle())
            .content(request.getContent())
            .simpleMeaning(request.getSimpleMeaning())
            .example(request.getExample())
            .whyItMatters(request.getWhyItMatters())
            .sourceUrl(request.getSourceUrl())
            .sourceType(request.getSourceType())
            .sourceTitle(request.getSourceTitle())
            .sourceReference(request.getSourceReference())
            .isFavorite(request.getIsFavorite() != null ? request.getIsFavorite() : false)
            .reviewEnabled(request.getReviewEnabled() != null ? request.getReviewEnabled() : false)
            .tags(tags)
            .build();

        note = noteRepository.save(note);

        // Link related notes
        if (request.getRelatedNoteIds() != null && !request.getRelatedNoteIds().isEmpty()) {
            linkRelatedNotes(note, userId, request.getRelatedNoteIds());
            note = noteRepository.save(note);
        }

        return toResponse(note);
    }

    @Transactional
    public NoteResponse updateNote(Long userId, Long noteId, NoteRequest request) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        if (request.getTitle() != null) note.setTitle(request.getTitle());
        if (request.getContent() != null) note.setContent(request.getContent());
        note.setSimpleMeaning(request.getSimpleMeaning());
        note.setExample(request.getExample());
        note.setWhyItMatters(request.getWhyItMatters());
        note.setSourceUrl(request.getSourceUrl());
        if (request.getSourceType() != null) note.setSourceType(request.getSourceType());
        note.setSourceTitle(request.getSourceTitle());
        note.setSourceReference(request.getSourceReference());
        if (request.getIsFavorite() != null) note.setIsFavorite(request.getIsFavorite());
        if (request.getReviewEnabled() != null) note.setReviewEnabled(request.getReviewEnabled());

        if (request.getSectionId() != null) {
            Section section = sectionRepository.findByIdAndUserId(request.getSectionId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
            note.setSection(section);
        } else if (request.getSectionId() == null && request.getTitle() != null) {
            note.setSection(null);
        }

        if (request.getTags() != null) {
            User user = userRepository.findById(userId).orElseThrow();
            note.setTags(resolveOrCreateTags(userId, user, request.getTags()));
        }

        if (request.getRelatedNoteIds() != null) {
            note.getRelatedNotes().clear();
            linkRelatedNotes(note, userId, request.getRelatedNoteIds());
        }

        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public void deleteNote(Long userId, Long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        noteRepository.delete(note);
    }

    @Transactional
    public NoteResponse toggleFavorite(Long userId, Long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found"));
        note.setIsFavorite(!note.getIsFavorite());
        return toResponse(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse duplicateNote(Long userId, Long noteId) {
        Note original = noteRepository.findByIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        Note copy = Note.builder()
            .user(original.getUser())
            .section(original.getSection())
            .title(original.getTitle() + " (Copy)")
            .content(original.getContent())
            .simpleMeaning(original.getSimpleMeaning())
            .example(original.getExample())
            .whyItMatters(original.getWhyItMatters())
            .sourceUrl(original.getSourceUrl())
            .sourceType(original.getSourceType())
            .sourceTitle(original.getSourceTitle())
            .isFavorite(false)
            .reviewEnabled(false)
            .tags(new HashSet<>(original.getTags()))
            .build();

        return toResponse(noteRepository.save(copy));
    }

    private Set<Tag> resolveOrCreateTags(Long userId, User user, Set<String> tagNames) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();

        Set<Tag> tags = new HashSet<>();
        for (String tagName : tagNames) {
            String cleanName = tagName.trim().toLowerCase();
            if (!cleanName.isEmpty()) {
                Tag tag = tagRepository.findByNameAndUserId(cleanName, userId)
                    .orElseGet(() -> tagRepository.save(
                        Tag.builder().user(user).name(cleanName).build()
                    ));
                tags.add(tag);
            }
        }
        return tags;
    }

    private void linkRelatedNotes(Note note, Long userId, Set<Long> relatedIds) {
        for (Long relId : relatedIds) {
            if (!relId.equals(note.getId())) {
                noteRepository.findByIdAndUserId(relId, userId).ifPresent(rel -> {
                    note.getRelatedNotes().add(rel);
                });
            }
        }
    }

    public NoteResponse toResponse(Note note) {
        Set<TagResponse> tagResponses = note.getTags() == null ? new HashSet<>() :
            note.getTags().stream().map(t -> TagResponse.builder()
                .id(t.getId()).name(t.getName()).createdAt(t.getCreatedAt()).build()
            ).collect(Collectors.toSet());

        Set<NoteStubResponse> relatedResponses = note.getRelatedNotes() == null ? new HashSet<>() :
            note.getRelatedNotes().stream().map(r -> NoteStubResponse.builder()
                .id(r.getId())
                .title(r.getTitle())
                .sectionName(r.getSection() != null ? r.getSection().getName() : null)
                .sectionIcon(r.getSection() != null ? r.getSection().getIcon() : null)
                .sectionAccentColor(r.getSection() != null ? r.getSection().getAccentColor() : null)
                .build()
            ).collect(Collectors.toSet());

        ReviewScheduleResponse reviewResp = null;
        if (note.getReviewSchedule() != null) {
            ReviewSchedule rs = note.getReviewSchedule();
            reviewResp = ReviewScheduleResponse.builder()
                .id(rs.getId())
                .noteId(note.getId())
                .noteTitle(note.getTitle())
                .nextReviewAt(rs.getNextReviewAt())
                .intervalDays(rs.getIntervalDays())
                .easeFactor(rs.getEaseFactor())
                .repetitions(rs.getRepetitions())
                .updatedAt(rs.getUpdatedAt())
                .build();
        }

        return NoteResponse.builder()
            .id(note.getId())
            .title(note.getTitle())
            .content(note.getContent())
            .simpleMeaning(note.getSimpleMeaning())
            .example(note.getExample())
            .whyItMatters(note.getWhyItMatters())
            .sourceUrl(note.getSourceUrl())
            .sourceType(note.getSourceType())
            .sourceTitle(note.getSourceTitle())
            .sourceReference(note.getSourceReference())
            .isFavorite(note.getIsFavorite())
            .reviewEnabled(note.getReviewEnabled())
            .sectionId(note.getSection() != null ? note.getSection().getId() : null)
            .sectionName(note.getSection() != null ? note.getSection().getName() : null)
            .sectionIcon(note.getSection() != null ? note.getSection().getIcon() : null)
            .sectionAccentColor(note.getSection() != null ? note.getSection().getAccentColor() : null)
            .tags(tagResponses)
            .relatedNotes(relatedResponses)
            .reviewSchedule(reviewResp)
            .createdAt(note.getCreatedAt())
            .updatedAt(note.getUpdatedAt())
            .build();
    }
}
