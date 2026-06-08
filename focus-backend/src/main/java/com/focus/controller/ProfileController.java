package com.focus.controller;

import com.focus.dto.ProfileRequest;
import com.focus.dto.ProfileResponse;
import com.focus.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(Authentication auth,
                                                          @RequestBody ProfileRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }
}
