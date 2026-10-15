package com.helpdesk360.service;

import com.helpdesk360.dto.*;
import com.helpdesk360.model.User;
import com.helpdesk360.repository.UserRepository;
import com.helpdesk360.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new LoginResponse(token, UserDTO.fromEntity(user));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<UserDTO> getTechnicians() {
        return userRepository.findByRole(User.Role.TECHNICIAN)
                .stream()
                .map(UserDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public boolean isTechnician(Long userId) {
        return userRepository.findById(userId)
                .map(u -> u.getRole() == User.Role.TECHNICIAN)
                .orElse(false);
    }
}
