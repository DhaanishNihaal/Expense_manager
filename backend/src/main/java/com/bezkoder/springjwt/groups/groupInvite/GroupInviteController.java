package com.bezkoder.springjwt.groups.groupInvite;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import java.util.List;
import com.bezkoder.springjwt.groups.groupInvite.dto.InviteRequest;
import com.bezkoder.springjwt.groups.groupInvite.dto.InviteResponse;


@RestController
@RequestMapping("/api")
public class GroupInviteController {

    private final GroupInviteService inviteService;

    public GroupInviteController(GroupInviteService inviteService) {
        this.inviteService = inviteService;
    }

    // 🔹 Send Invite
    @PostMapping("/groups/{groupId}/invite")
    public ResponseEntity<?> sendInvite(@PathVariable Long groupId,
                                        @RequestBody InviteRequest request,
                                        Authentication authentication) {

        inviteService.sendInvite(groupId,
                request.getUsername(),
                authentication.getName());

        return ResponseEntity.ok("Invite sent");
    }

    // 🔹 Get My Invites
    @GetMapping("/users/me/invites")
    public List<InviteResponse> getMyInvites(Authentication authentication) {
        return inviteService.getMyInvites(authentication.getName());
    }

    // 🔹 Accept
    @PostMapping("/invites/{inviteId}/accept")
    public ResponseEntity<?> acceptInvite(@PathVariable Long inviteId,
                                          Authentication authentication) {

        inviteService.acceptInvite(inviteId, authentication.getName());
        return ResponseEntity.ok("Invite accepted");
    }

    // 🔹 Reject
    @PostMapping("/invites/{inviteId}/reject")
    public ResponseEntity<?> rejectInvite(@PathVariable Long inviteId,
                                          Authentication authentication) {

        inviteService.rejectInvite(inviteId, authentication.getName());
        return ResponseEntity.ok("Invite rejected");
    }
}
