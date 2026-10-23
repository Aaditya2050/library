package com.recall.app.repository;

import com.recall.app.entity.ReviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewScheduleRepository extends JpaRepository<ReviewSchedule, Long> {
    Optional<ReviewSchedule> findByNoteIdAndUserId(Long noteId, Long userId);
    Optional<ReviewSchedule> findByNoteId(Long noteId);

    @Query("SELECT rs FROM ReviewSchedule rs WHERE rs.user.id = :userId AND rs.nextReviewAt <= :today ORDER BY rs.nextReviewAt ASC")
    List<ReviewSchedule> findDueReviews(@Param("userId") Long userId, @Param("today") LocalDate today);

    long countByUserIdAndNextReviewAtLessThanEqual(Long userId, LocalDate today);
}
