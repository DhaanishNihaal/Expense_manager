package com.bezkoder.springjwt.groups.dto;

import java.util.List;

public class GroupDetailResponse {

    private Long id;
    private String name;
    private String description;
    private List<MemberResponse> members;

    public GroupDetailResponse(Long id, String name, String description, List<MemberResponse> members) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.members = members;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public List<MemberResponse> getMembers() { return members; }
}