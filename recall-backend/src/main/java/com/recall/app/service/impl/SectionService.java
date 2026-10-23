package com.recall.app.service.impl;

import com.recall.app.dto.request.SectionRequest;
import com.recall.app.dto.response.SectionResponse;
import com.recall.app.entity.Section;
import com.recall.app.entity.User;
import com.recall.app.exception.ResourceNotFoundException;
import com.recall.app.repository.NoteRepository;
import com.recall.app.repository.SectionRepository;
import com.recall.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SectionService {

    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public List<SectionResponse> getUserSections(Long userId) {
        return sectionRepository.findByUserIdOrderByDisplayOrderAscCreatedAtAsc(userId)
            .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SectionResponse getSection(Long userId, Long sectionId) {
        Section section = sectionRepository.findByIdAndUserId(sectionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        return toResponse(section);
    }

    @Transactional
    public SectionResponse createSection(Long userId, SectionRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        long order = sectionRepository.countByUserId(userId);

        Section section = Section.builder()
            .user(user)
            .name(request.getName())
            .description(request.getDescription())
            .icon(request.getIcon() != null ? request.getIcon() : "BookOpen")
            .accentColor(request.getAccentColor() != null ? request.getAccentColor() : "#6366f1")
            .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : (int) order)
            .build();

        return toResponse(sectionRepository.save(section));
    }

    @Transactional
    public SectionResponse updateSection(Long userId, Long sectionId, SectionRequest request) {
        Section section = sectionRepository.findByIdAndUserId(sectionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Section not found"));

        if (request.getName() != null) section.setName(request.getName());
        if (request.getDescription() != null) section.setDescription(request.getDescription());
        if (request.getIcon() != null) section.setIcon(request.getIcon());
        if (request.getAccentColor() != null) section.setAccentColor(request.getAccentColor());
        if (request.getDisplayOrder() != null) section.setDisplayOrder(request.getDisplayOrder());

        return toResponse(sectionRepository.save(section));
    }

    @Transactional
    public void deleteSection(Long userId, Long sectionId) {
        Section section = sectionRepository.findByIdAndUserId(sectionId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Section not found"));
        // Notes with this section will have section_id set to NULL (ON DELETE SET NULL in DB)
        sectionRepository.delete(section);
    }

    public SectionResponse toResponse(Section section) {
        long noteCount = section.getNotes() != null ? section.getNotes().size() : 0;
        return SectionResponse.builder()
            .id(section.getId())
            .name(section.getName())
            .description(section.getDescription())
            .icon(section.getIcon())
            .accentColor(section.getAccentColor())
            .displayOrder(section.getDisplayOrder())
            .noteCount(noteCount)
            .createdAt(section.getCreatedAt())
            .updatedAt(section.getUpdatedAt())
            .build();
    }
}
