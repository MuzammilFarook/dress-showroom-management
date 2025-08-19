package com.showroom.management.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import com.showroom.management.entity.User;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private UserDTO user;
    private String message;
}