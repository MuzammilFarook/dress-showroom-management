package com.showroom.management.config;

import com.showroom.management.entity.User;
import com.showroom.management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        initializeUsers();
    }

    private void initializeUsers() {
        if (userRepository.count() == 0) {
            log.info("Initializing default users...");

            // Owner
            createUser("admin", "admin814463", "Store Owner", User.Role.OWNER, "All Outlets");

            // Managers
            createUser("manager1", "manager123", "Manager One", User.Role.MANAGER, "Outlet 1");
            createUser("manager2", "manager123", "Manager Two", User.Role.MANAGER, "Outlet 2");
            createUser("manager3", "manager123", "Manager Three", User.Role.MANAGER, "Outlet 3");
            createUser("manager4", "manager123", "Manager Four", User.Role.MANAGER, "Outlet 4");

            // Sales Representatives
            createUser("sales1", "sales123", "Sales Rep One", User.Role.SALES, "Outlet 1");
            createUser("sales2", "sales123", "Sales Rep Two", User.Role.SALES, "Outlet 1");
            createUser("sales3", "sales123", "Sales Rep Three", User.Role.SALES, "Outlet 2");
            createUser("sales4", "sales123", "Sales Rep Four", User.Role.SALES, "Outlet 2");
            createUser("sales5", "sales123", "Sales Rep Five", User.Role.SALES, "Outlet 3");
            createUser("sales6", "sales123", "Sales Rep Six", User.Role.SALES, "Outlet 4");

            log.info("Default users created successfully");
        }
    }

    private void createUser(String username, String password, String fullName, User.Role role, String outlet) {
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(role);
        user.setOutlet(outlet);
        user.setIsActive(true);
        userRepository.save(user);
    }
}