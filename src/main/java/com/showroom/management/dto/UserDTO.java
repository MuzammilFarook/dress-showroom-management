package com.showroom.management.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.showroom.management.entity.User;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String fullName;
    private User.Role role;
    private String outlet;
    private Boolean isActive;

    public static UserDTO fromEntity(User user) {
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole(),
                user.getOutlet(),
                user.getIsActive()
        );
    }
}