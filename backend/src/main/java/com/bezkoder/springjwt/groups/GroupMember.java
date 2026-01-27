package com.bezkoder.springjwt.groups;

import com.bezkoder.springjwt.models.User;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "group_members",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"group_id", "user_id"})
    }
)
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which group
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    // Which user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ADMIN / MEMBER
    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public Group getGroup() {
        return group;
    }

    public void setGroup(Group group) {
        this.group = group;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }
}
