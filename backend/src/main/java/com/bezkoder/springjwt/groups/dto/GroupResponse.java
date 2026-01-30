package com.bezkoder.springjwt.groups.dto;

import java.time.LocalDateTime;

public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private Integer memberCount;

    // Constructors
    public GroupResponse() {}

    public GroupResponse(Long id, String name, String description, LocalDateTime createdAt, Integer memberCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.memberCount = memberCount;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(Integer memberCount) {
        this.memberCount = memberCount;
    }
}
