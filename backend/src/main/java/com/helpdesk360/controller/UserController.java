package com.helpdesk360.controller;

import com.helpdesk360.dto.UserDTO;
import com.helpdesk360.model.User;
import com.helpdesk360.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(UserDTO.fromEntity(currentUser));
    }

    @GetMapping("/technicians")
    public ResponseEntity<?> getTechnicians(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getRole() != User.Role.TECHNICIAN) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }
        List<UserDTO> technicians = userService.getTechnicians();
        return ResponseEntity.ok(technicians);
    }
}
