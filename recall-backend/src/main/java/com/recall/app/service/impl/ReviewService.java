package com.recall.app.service.impl;

import com.recall.app.dto.response.ReviewScheduleResponse;
import com.recall.app.entity.*;
import com.recall.app.exception.BadRequestException;
import com.recall.app.exception.ResourceNotFoundException;
import com.recall.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewScheduleRepository scheduleRepository;
    private final ReviewHistoryRepository historyRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReviewScheduleResponse enableReview(Long userId, Long noteId) {
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

        // Check if already exists
        if (scheduleRepository.findByNoteId(noteId).isPresent()) {
            return toResponse(scheduleRepository.findByNoteId(noteId).get());
        }

        User user = userRepository.findById(userId).orElseThrow();
        note.setReviewEnabled(true);
        noteRepository.save(note);

        ReviewSchedule schedule = ReviewSchedule.builder()
            .note(note)
            .user(user)
            .nextReviewAt(LocalDate.now())
            .intervalDays(1)
            .easeFactor(2.5)
            .repetitions(0)
            .build();

        return toResponse(scheduleRepository.save(schedule));
    }

    @Transactional(readOnly = true)
    public List<ReviewScheduleResponse> getDueReviews(Long userId) {
        return scheduleRepository.findDueReviews(userId, LocalDate.now())
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ReviewScheduleResponse submitReview(Long userId, Long noteId, String ratingStr) {
        ReviewHistory.Rating rating;
        try {
            rating = ReviewHistory.Rating.valueOf(ratingStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid rating. Use: AGAIN, HARD, GOOD, EASY");
        }

        ReviewSchedule schedule = scheduleRepository.findByNoteIdAndUserId(noteId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Review schedule not found. Enable review first."));

        int oldInterval = schedule.getIntervalDays();
        double oldEase = schedule.getEaseFactor();
        int reps = schedule.getRepetitions();

        // SM-2 simplified algorithm
        int newInterval;
        double newEase;
        int newReps;

        switch (rating) {
            case AGAIN -> {
                newInterval = 1;
                newEase = Math.max(1.3, oldEase - 0.2);
                newReps = 0;
            }
            case HARD -> {
                newInterval = Math.max(1, (int)(oldInterval * 1.2));
                newEase = Math.max(1.3, oldEase - 0.15);
                newReps = reps + 1;
            }
            case GOOD -> {
                newInterval = reps == 0 ? 1 : reps == 1 ? 6 : (int)(oldInterval * oldEase);
                newEase = oldEase;
                newReps = reps + 1;
            }
            case EASY -> {
                newInterval = reps == 0 ? 4 : (int)(oldInterval * oldEase * 1.3);
                newEase = oldEase + 0.1;
                newReps = reps + 1;
            }
            default -> throw new BadRequestException("Invalid rating");
        }

        newInterval = Math.max(1, newInterval);
        newEase = Math.min(4.0, Math.max(1.3, newEase));

        User user = userRepository.findById(userId).orElseThrow();

        // Save history
        ReviewHistory history = ReviewHistory.builder()
            .reviewSchedule(schedule)
            .user(user)
            .note(schedule.getNote())
            .rating(rating)
            .intervalDaysBefore(oldInterval)
            .intervalDaysAfter(newInterval)
            .build();
        historyRepository.save(history);

        // Update schedule
        schedule.setIntervalDays(newInterval);
        schedule.setEaseFactor(newEase);
        schedule.setRepetitions(newReps);
        schedule.setNextReviewAt(LocalDate.now().plusDays(newInterval));

        return toResponse(scheduleRepository.save(schedule));
    }

    @Transactional(readOnly = true)
    public long getDueCount(Long userId) {
        return scheduleRepository.countByUserIdAndNextReviewAtLessThanEqual(userId, LocalDate.now());
    }

    private ReviewScheduleResponse toResponse(ReviewSchedule rs) {
        return ReviewScheduleResponse.builder()
            .id(rs.getId())
            .noteId(rs.getNote().getId())
            .noteTitle(rs.getNote().getTitle())
            .nextReviewAt(rs.getNextReviewAt())
            .intervalDays(rs.getIntervalDays())
            .easeFactor(rs.getEaseFactor())
            .repetitions(rs.getRepetitions())
            .updatedAt(rs.getUpdatedAt())
            .build();
    }
}
