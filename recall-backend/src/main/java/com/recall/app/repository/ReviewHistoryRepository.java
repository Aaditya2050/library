package com.recall.app.repository;

import com.recall.app.entity.ReviewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewHistoryRepository extends JpaRepository<ReviewHistory, Long> {
    List<ReviewHistory> findByNoteIdOrderByReviewedAtDesc(Long noteId);
    long countByUserId(Long userId);
}
