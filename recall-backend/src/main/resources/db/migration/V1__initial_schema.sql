-- V1: Initial schema for Recall application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'BookOpen',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sections_user (user_id),
    INDEX idx_sections_order (user_id, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_tag (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_tags_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    section_id BIGINT,
    title VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    simple_meaning TEXT,
    example TEXT,
    why_it_matters TEXT,
    source_url VARCHAR(1000),
    source_type ENUM('BOOK','VIDEO','ARTICLE','COURSE','PERSONAL','OTHER') DEFAULT 'PERSONAL',
    source_title VARCHAR(500),
    source_reference VARCHAR(200),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    review_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
    INDEX idx_notes_user (user_id),
    INDEX idx_notes_section (section_id),
    INDEX idx_notes_favorite (user_id, is_favorite),
    FULLTEXT INDEX ft_notes_search (title, content, simple_meaning, example)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note-Tag junction
CREATE TABLE IF NOT EXISTS note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Related notes (self-referencing)
CREATE TABLE IF NOT EXISTS related_notes (
    note_id BIGINT NOT NULL,
    related_note_id BIGINT NOT NULL,
    PRIMARY KEY (note_id, related_note_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (related_note_id) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_relation CHECK (note_id != related_note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review schedules (spaced repetition)
CREATE TABLE IF NOT EXISTS review_schedules (
    id BIGINT NOT NULL AUTO_INCREMENT,
    note_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    next_review_at DATE NOT NULL,
    interval_days INT NOT NULL DEFAULT 1,
    ease_factor DOUBLE NOT NULL DEFAULT 2.5,
    repetitions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_review_user_date (user_id, next_review_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review history
CREATE TABLE IF NOT EXISTS review_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    review_schedule_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    note_id BIGINT NOT NULL,
    rating ENUM('AGAIN','HARD','GOOD','EASY') NOT NULL,
    interval_days_before INT NOT NULL,
    interval_days_after INT NOT NULL,
    reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (review_schedule_id) REFERENCES review_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    INDEX idx_history_user (user_id),
    INDEX idx_history_note (note_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
