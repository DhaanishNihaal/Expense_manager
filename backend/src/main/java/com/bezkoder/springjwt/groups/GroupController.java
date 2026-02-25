package com.bezkoder.springjwt.groups;

import com.bezkoder.springjwt.groups.dto.AddGroupMemberRequest;
import com.bezkoder.springjwt.groups.dto.CreateGroupRequest;
import com.bezkoder.springjwt.groups.dto.GroupResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity; 
import java.util.List;

import com.bezkoder.springjwt.groups.dto.GroupDetailResponse;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping
    public Group createGroup(@RequestBody CreateGroupRequest request,
                             Authentication authentication) {

        String username = authentication.getName();
        return groupService.createGroup(request, username);
    }
    // @PostMapping("/{groupId}/members")
    // public String addMember(@PathVariable Long groupId,
    //                     @RequestBody AddGroupMemberRequest request,
    //                     Authentication authentication) {

    //     String adminUsername = authentication.getName();
    //     groupService.addMember(groupId, adminUsername, request.getUsername());

    //     return "Member added successfully";
    // }
    @GetMapping
    public List<GroupResponse> getMyGroups(Authentication authentication) {

        String username = authentication.getName();
        return groupService.getUserGroupsWithMemberCount(username);
    }
    @GetMapping("/{groupId}")
    public GroupDetailResponse getGroupDetails(@PathVariable Long groupId,
                                               Authentication authentication) {

        return groupService.getGroupDetails(groupId, authentication.getName());
    }

    @DeleteMapping("/{groupId}/leave")
    public ResponseEntity<?> leaveGroup(
        @PathVariable Long groupId,
        Authentication authentication) {

    groupService.leaveGroup(groupId, authentication.getName());
    return ResponseEntity.ok("Left group successfully");
    }
    @DeleteMapping("/{groupId}/remove/{memberId}")
    public ResponseEntity<?> removeMember(
        @PathVariable Long groupId,
        @PathVariable Long memberId,
        Authentication authentication) {
    groupService.removeMember(groupId,authentication.getName(),memberId);
    return ResponseEntity.ok("Member removed successfully");
    }

}
