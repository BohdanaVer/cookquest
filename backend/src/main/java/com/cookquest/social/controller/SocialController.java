package com.cookquest.social.controller;

import com.cookquest.social.dto.FriendDto;
import com.cookquest.social.dto.FriendRequestDto;
import com.cookquest.social.dto.SendFriendRequest;
import com.cookquest.social.dto.UserSearchDto;
import com.cookquest.social.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/friends")
@RequiredArgsConstructor
public class SocialController {

    private final FriendshipService friendshipService;

    @PostMapping("/request")
    public ResponseEntity<Void> sendRequest(@RequestBody SendFriendRequest request) {
        friendshipService.sendRequest(request.targetUsername());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<Void> acceptRequest(@PathVariable Long friendshipId) {
        friendshipService.acceptRequest(friendshipId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{friendshipId}/decline")
    public ResponseEntity<Void> declineRequest(@PathVariable Long friendshipId) {
        friendshipService.declineRequest(friendshipId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<FriendDto>> getFriends() {
        return ResponseEntity.ok(friendshipService.getFriendsList());
    }

    @GetMapping("/requests")
    public ResponseEntity<List<FriendRequestDto>> getRequests() {
        return ResponseEntity.ok(friendshipService.getPendingRequests());
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchDto>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(friendshipService.searchUsers(query));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<UserSearchDto>> getSuggestions() {
        return ResponseEntity.ok(friendshipService.getSuggestions(10));
    }
}