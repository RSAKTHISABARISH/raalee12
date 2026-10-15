package com.helpdesk360.config;

import com.helpdesk360.model.User;
import com.helpdesk360.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Only seed if no users exist
            if (userRepository.count() == 0) {
                System.out.println("[SEED] Creating test accounts...");

                // Employee accounts
                userRepository.save(new User(
                    "Alice Johnson", "alice@company.com",
                    passwordEncoder.encode("password123"), User.Role.EMPLOYEE
                ));
                userRepository.save(new User(
                    "Bob Smith", "bob@company.com",
                    passwordEncoder.encode("password123"), User.Role.EMPLOYEE
                ));
                userRepository.save(new User(
                    "Carol Davis", "carol@company.com",
                    passwordEncoder.encode("password123"), User.Role.EMPLOYEE
                ));

                // Technician accounts
                userRepository.save(new User(
                    "Dave Tech", "dave@company.com",
                    passwordEncoder.encode("password123"), User.Role.TECHNICIAN
                ));
                userRepository.save(new User(
                    "Eve Support", "eve@company.com",
                    passwordEncoder.encode("password123"), User.Role.TECHNICIAN
                ));

                System.out.println("[SEED] Test accounts created:");
                System.out.println("  Employees: alice@company.com, bob@company.com, carol@company.com");
                System.out.println("  Technicians: dave@company.com, eve@company.com");
                System.out.println("  All passwords: password123");
            } else {
                System.out.println("[SEED] Users already exist, skipping seed.");
            }
        };
    }
}
