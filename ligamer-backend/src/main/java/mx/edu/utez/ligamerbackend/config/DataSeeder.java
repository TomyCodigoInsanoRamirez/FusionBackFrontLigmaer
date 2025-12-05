package mx.edu.utez.ligamerbackend.config;

import mx.edu.utez.ligamerbackend.models.Role;
import mx.edu.utez.ligamerbackend.models.User;
import mx.edu.utez.ligamerbackend.repositories.RoleRepository;
import mx.edu.utez.ligamerbackend.repositories.UserRepository;
import mx.edu.utez.ligamerbackend.utils.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        createRoleIfNotFound(AppConstants.ROLE_JUGADOR);
        createRoleIfNotFound(AppConstants.ROLE_ORGANIZADOR);
        createRoleIfNotFound(AppConstants.ROLE_ADMINISTRADOR);
        createDefaultAdmin();
    }

    private void createRoleIfNotFound(String name) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role newRole = new Role();
            newRole.setName(name);
            roleRepository.save(newRole);
        }
    }

    private void createDefaultAdmin() {
        String adminEmail = System.getenv().getOrDefault("LIGAMER_ADMIN_EMAIL", "admin@gmail.com");
        String adminPassword = System.getenv().getOrDefault("LIGAMER_ADMIN_PASSWORD", "Pass123!");
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setNombre("Administrador");
            admin.setApellidoPaterno("Sistema");
            admin.setApellidoMaterno("LIGAMER");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setActive(true);
            Role adminRole = roleRepository.findByName(AppConstants.ROLE_ADMINISTRADOR).orElse(null);
            admin.setRole(adminRole);
            userRepository.save(admin);
        }
    }
}