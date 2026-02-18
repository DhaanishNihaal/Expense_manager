package com.bezkoder.springjwt.repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @GetMapping("/users/search")
    public List<UserSearchResponse> searchUsers(
            @RequestParam String keyword) {
    
        return userRepository.searchUsers(keyword)
                .stream()
                .map(u -> new UserSearchResponse(
                        u.getId(),
                        u.getUsername(),
                        u.getName()
                ))
                .toList();
    }
}
