export interface Invite {
    inviteId: number;
    groupId: number;
    groupName: string;
    invitedBy: string;
    status: "PENDING" | "ACCEPTED" | "REJECTED";
    invitedUserId: number;
}
