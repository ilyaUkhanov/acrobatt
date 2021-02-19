package com.g6.acrobatteAPI.projections.segment;

import org.springframework.beans.factory.annotation.Value;

public interface SegmentProjection {

    @Value("#{target.name}")
    public String getName();

    @Value("#{target.id}")
    public Long getId();

}