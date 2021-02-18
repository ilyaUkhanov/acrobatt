package com.g6.acrobatteAPI.services;

import java.util.Optional;

import com.g6.acrobatteAPI.entities.Segment;
import com.g6.acrobatteAPI.projections.segment.SegmentProjection;
import com.g6.acrobatteAPI.repositories.SegmentRepository;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SegmentService {
    private final SegmentRepository segmentRepository;

    public SegmentProjection getProjectionById(Long id) {
        return segmentRepository.findById(id, SegmentProjection.class);
    }

    public Optional<Segment> getById(Long id) {
        return segmentRepository.findById(id);
    }
}
