package com.bezkoder.springjwt.groups.dto;
public class MemberResponse {

    private Long id;
    private String name;
    private String role;

    public MemberResponse(Long id, String name, String role) {
        this.id = id;
        this.name = name;
        this.role = role;

    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getRole() { return role; }
}