package com.recall.app.service.impl;

import com.recall.app.dto.response.*;
import com.recall.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final NoteRepository noteRepository;
    private final SectionRepository sectionRepository;
    private final ReviewScheduleRepository scheduleRepository;
    private final NoteService noteService;
    private final SectionService sectionService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        long totalNotes = noteRepository.countByUserId(userId);
        long totalSections = sectionRepository.countByUserId(userId);
        long favoriteCount = noteRepository.countByUserIdAndIsFavoriteTrue(userId);
        long dueReviews = scheduleRepository.countByUserIdAndNextReviewAtLessThanEqual(userId, LocalDate.now());

        List<NoteResponse> recentNotes = noteRepository
            .findRecentByUserId(userId, PageRequest.of(0, 6))
            .stream().map(noteService::toResponse).collect(Collectors.toList());

        List<NoteResponse> favorites = noteRepository
            .findByUserIdAndIsFavoriteTrueOrderByUpdatedAtDesc(userId, PageRequest.of(0, 6))
            .getContent().stream().map(noteService::toResponse).collect(Collectors.toList());

        List<SectionResponse> sections = sectionRepository
            .findByUserIdOrderByDisplayOrderAscCreatedAtAsc(userId)
            .stream().map(sectionService::toResponse).collect(Collectors.toList());

        return DashboardResponse.builder()
            .totalNotes(totalNotes)
            .totalSections(totalSections)
            .favoriteNotes(favoriteCount)
            .dueReviews(dueReviews)
            .recentNotes(recentNotes)
            .favoriteNotes2(favorites)
            .sections(sections)
            .build();
    }
}
