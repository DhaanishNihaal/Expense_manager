package com.bezkoder.springjwt.groups.groupInvite.dto;

public class InviteResponse {

    private Long inviteId;
    private Long groupId;
    private String groupName;
    private String invitedBy;
    private String status;
    private Long invitedUserId;
    private String invitedUsername;

    public InviteResponse(Long inviteId, Long groupId, String groupName,
                          String invitedBy, String status, Long invitedUserId, String invitedUsername) {
        this.inviteId = inviteId;
        this.groupId = groupId;
        this.groupName = groupName;
        this.invitedBy = invitedBy;
        this.status = status;
        this.invitedUserId = invitedUserId;
        this.invitedUsername = invitedUsername;
    }

    // Getters
    public Long getInviteId() { return inviteId; }
    public Long getGroupId() { return groupId; }
    public String getGroupName() { return groupName; }
    public String getInvitedBy() { return invitedBy; }
    public String getStatus() { return status; }
    public Long getInvitedUserId() { return invitedUserId; }
    public String getInvitedUsername() { return invitedUsername; }
}