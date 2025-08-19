package com.showroom.management.service;

import com.showroom.management.dto.*;
import com.showroom.management.entity.User;
import com.showroom.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<UserDTO> getAllUsers(String currentUserRole, String currentUserOutlet) {
        List<User> users;

        if ("OWNER".equals(currentUserRole)) {
            users = userRepository.findByIsActiveTrue();
        } else if ("MANAGER".equals(currentUserRole)) {
            users = userRepository.findByOutlet(currentUserOutlet);
        } else {
            // Sales rep can only see themselves
            users = userRepository.findByOutlet(currentUserOutlet)
                    .stream()
                    .filter(u -> u.getRole() == User.Role.SALES)
                    .collect(Collectors.toList());
        }

        return users.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UserDTO> getSalesReps(String outlet) {
        List<User> salesReps;

        if ("All Outlets".equals(outlet)) {
            salesReps = userRepository.findByRole(User.Role.SALES);
        } else {
            salesReps = userRepository.findByRoleAndOutlet(User.Role.SALES, outlet);
        }

        return salesReps.stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public UserDTO createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        // Generate default password based on role
        String defaultPassword = getDefaultPassword(request.getRole());

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(defaultPassword));
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setOutlet(request.getOutlet());
        user.setIsActive(true);

        User savedUser = userRepository.save(user);
        return UserDTO.fromEntity(savedUser);
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("admin".equals(user.getUsername())) {
            throw new RuntimeException("Cannot delete admin user");
        }

        user.setIsActive(false);
        userRepository.save(user);
    }

    private String getDefaultPassword(User.Role role) {
        return switch (role) {
            case OWNER -> "admin123";
            case MANAGER -> "manager123";
            case SALES -> "sales123";
        };
    }
}