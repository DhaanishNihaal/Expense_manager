package com.bezkoder.springjwt.groups.groupInvite;

import com.bezkoder.springjwt.models.User;
import jakarta.persistence.*;
import com.bezkoder.springjwt.groups.Group;

import java.time.LocalDateTime;

@Entity
@Table(name = "group_invites")
public class GroupInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @ManyToOne
    @JoinColumn(name = "invited_user_id", nullable = false)
    private User invitedUser;

    @ManyToOne
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private User invitedBy;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED

    private LocalDateTime createdAt;

    public GroupInvite() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    // Getters & Setters
    public Long getId() {
        return id;
    }
    public Group getGroup() {
        return group;
    }
    public void setGroup(Group group) {
        this.group = group;
    }
    public User getInvitedUser() {
        return invitedUser;
    }
    public void setInvitedUser(User invitedUser) {
        this.invitedUser = invitedUser;
    }
    public User getInvitedBy() {
        return invitedBy;
    }
    public void setInvitedBy(User invitedBy) {
        this.invitedBy = invitedBy;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
}