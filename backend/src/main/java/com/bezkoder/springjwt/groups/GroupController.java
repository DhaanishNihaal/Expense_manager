package com.bezkoder.springjwt.groups;

import com.bezkoder.springjwt.groups.dto.AddGroupMemberRequest;
import com.bezkoder.springjwt.groups.dto.CreateGroupRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    @PostMapping("/{groupId}/members")
    public String addMember(@PathVariable Long groupId,
                        @RequestBody AddGroupMemberRequest request,
                        Authentication authentication) {

        String adminUsername = authentication.getName();
        groupService.addMember(groupId, adminUsername, request.getUsername());

        return "Member added successfully";
    }
}
