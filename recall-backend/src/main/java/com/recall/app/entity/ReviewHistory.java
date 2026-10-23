package com.recall.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "review_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_schedule_id", nullable = false)
    private ReviewSchedule reviewSchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Rating rating;

    @Column(name = "interval_days_before", nullable = false)
    private Integer intervalDaysBefore;

    @Column(name = "interval_days_after", nullable = false)
    private Integer intervalDaysAfter;

    @Column(name = "reviewed_at", nullable = false)
    @Builder.Default
    private LocalDateTime reviewedAt = LocalDateTime.now();

    public enum Rating {
        AGAIN, HARD, GOOD, EASY
    }
}
