package com.recall.app.repository;

import com.recall.app.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    Page<Note> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Note> findByUserIdAndSectionIdOrderByCreatedAtDesc(Long userId, Long sectionId, Pageable pageable);
    Page<Note> findByUserIdAndIsFavoriteTrueOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    Optional<Note> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
    long countByUserIdAndIsFavoriteTrue(Long userId);

    // Full-text search using LIKE for compatibility (upgrade to FULLTEXT in production)
    @Query("SELECT n FROM Note n WHERE n.user.id = :userId AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(n.content) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(n.simpleMeaning) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           " LOWER(n.example) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Note> searchByText(@Param("userId") Long userId, @Param("q") String query, Pageable pageable);

    @Query("SELECT n FROM Note n WHERE n.user.id = :userId ORDER BY n.createdAt DESC")
    List<Note> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);

    List<Note> findByUserIdAndSectionIdIsNullOrderByCreatedAtDesc(Long userId);
}
