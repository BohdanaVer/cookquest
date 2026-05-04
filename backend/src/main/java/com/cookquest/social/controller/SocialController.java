package com.cookquest.social.controller;

import com.cookquest.social.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/friends")
@RequiredArgsConstructor
public class SocialController {

    private final FriendshipService friendshipService;

    @PostMapping("/request")
    public ResponseEntity<?> sendRequest(@RequestBody Map<String, String> body) {
        String targetUsername = body.get("targetUsername");
        return ResponseEntity.ok(friendshipService.sendRequest(targetUsername));
    }

    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long friendshipId) {
        return ResponseEntity.ok(friendshipService.acceptRequest(friendshipId));
    }

    @PostMapping("/{friendshipId}/decline")
    public ResponseEntity<?> declineRequest(@PathVariable Long friendshipId) {
        friendshipService.declineRequest(friendshipId);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> getFriends() {
        return ResponseEntity.ok(friendshipService.getFriendsList());
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        return ResponseEntity.ok(friendshipService.getPendingRequests());
    }
}
