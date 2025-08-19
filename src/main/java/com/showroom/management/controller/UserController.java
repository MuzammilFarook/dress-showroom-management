package com.showroom.management.controller;

import com.showroom.management.dto.*;
import com.showroom.management.security.UserDetailsImpl;
import com.showroom.management.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<UserDTO> users = userService.getAllUsers(
                userDetails.getRole().name(),
                userDetails.getOutlet()
        );
        return ResponseEntity.ok(users);
    }

    @GetMapping("/sales-reps")
    public ResponseEntity<List<UserDTO>> getSalesReps(
            @RequestParam(defaultValue = "All Outlets") String outlet,
            Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        // For non-owners, limit to their outlet
        if (!userDetails.getRole().name().equals("OWNER")) {
            outlet = userDetails.getOutlet();
        }

        List<UserDTO> salesReps = userService.getSalesReps(outlet);
        return ResponseEntity.ok(salesReps);
    }

    @PostMapping
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        try {
            UserDTO newUser = userService.createUser(request);
            return ResponseEntity.ok(new ApiResponse(true, "User created successfully", newUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.deleteUser(userId);
            return ResponseEntity.ok(new ApiResponse(true, "User deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse(false, e.getMessage()));
        }
    }
}