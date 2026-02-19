import api from "./api";

export interface Invite {
    inviteId: number;
    groupId: number;
    groupName: string;
    invitedBy: string;
    status: string;
    invitedUserId: number;
}

export const getMyInvites = async (): Promise<Invite[]> => {
    const res = await api.get("/api/users/me/invites");
    return res.data;
};

export const getGroupInvites = async (groupId: number): Promise<Invite[]> => {
    const res = await api.get(`/api/groups/${groupId}/invites`);
    return res.data;
};

export const sendInvite = async (
    groupId: number,
    username: string
): Promise<void> => {
    await api.post(`/api/groups/${groupId}/invite`, { username });
};

export const acceptInvite = async (inviteId: number): Promise<void> => {
    await api.post(`/api/invites/${inviteId}/accept`);
};

export const rejectInvite = async (inviteId: number): Promise<void> => {
    await api.post(`/api/invites/${inviteId}/reject`);
};
