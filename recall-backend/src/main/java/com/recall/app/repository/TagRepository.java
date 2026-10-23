package com.recall.app.repository;

import com.recall.app.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByUserIdOrderByNameAsc(Long userId);
    Optional<Tag> findByNameAndUserId(String name, Long userId);
    Optional<Tag> findByIdAndUserId(Long id, Long userId);
}
