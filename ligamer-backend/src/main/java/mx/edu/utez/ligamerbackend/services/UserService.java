package mx.edu.utez.ligamerbackend.services;

import mx.edu.utez.ligamerbackend.dtos.UpdateProfileDto;
import mx.edu.utez.ligamerbackend.dtos.UserDto;
import mx.edu.utez.ligamerbackend.dtos.UserProfileDto;
import mx.edu.utez.ligamerbackend.dtos.TeamInfoDto;
import mx.edu.utez.ligamerbackend.events.*;
import mx.edu.utez.ligamerbackend.models.Role;
import mx.edu.utez.ligamerbackend.models.User;
import mx.edu.utez.ligamerbackend.models.Team;
import mx.edu.utez.ligamerbackend.repositories.RoleRepository;
import mx.edu.utez.ligamerbackend.repositories.UserRepository;
import mx.edu.utez.ligamerbackend.utils.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Transactional
    public User registerNewUser(UserDto userDto) throws Exception {
        // Validar que el correo no esté registrado
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new Exception(
                    "Ya hay una cuenta asociada al correo " + userDto.getEmail() + ". Intenta con uno diferente.");
        }

        // Validar que las contraseñas coincidan
        if (!userDto.getPassword().equals(userDto.getConfirmPassword())) {
            throw new Exception("Las contraseñas no coinciden. Por favor, verificarlas.");
        }

        User newUser = new User();
        newUser.setNombre(userDto.getNombre());
        newUser.setApellidoPaterno(userDto.getApellidoPaterno());
        newUser.setApellidoMaterno(userDto.getApellidoMaterno());
        newUser.setEmail(userDto.getEmail());
        newUser.setUsername(userDto.getUsername());
        newUser.setPassword(passwordEncoder.encode(userDto.getPassword()));
        newUser.setActive(true);

        Role userRole = roleRepository.findByName(AppConstants.ROLE_JUGADOR)
                .orElseThrow(() -> new Exception("Rol de Jugador no encontrado."));
        newUser.setRole(userRole);

        User savedUser = userRepository.save(newUser);

        // Publicar evento de registro
        eventPublisher.publishEvent(new UserRegisteredEvent(this,
                savedUser.getEmail(),
                savedUser.getId(),
                userRole.getName()));

        return savedUser;
    }

    public void generatePasswordResetToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con el email: " + email));

        String token = UUID.randomUUID().toString();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

        user.setResetPasswordToken(token);
        user.setResetPasswordTokenExpiry(expiryDate);
        userRepository.save(user);

        // Publicar evento de solicitud de recuperación de contraseña
        eventPublisher.publishEvent(new PasswordResetRequestedEvent(this, user.getEmail(), token));
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Token de restablecimiento inválido."));

        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El enlace de restablecimiento ha caducado. Por favor, solicita uno nuevo.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);

        User savedUser = userRepository.save(user);

        // Publicar evento de contraseña restablecida
        eventPublisher.publishEvent(new PasswordResetCompletedEvent(this, savedUser.getEmail(), savedUser.getId()));
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con el email: " + email));
    }

    @Transactional
    public User updateProfile(String currentEmail, UpdateProfileDto updateProfileDto) throws Exception {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        boolean emailChanged = false;
        boolean passwordChanged = false;
        boolean profileDataChanged = false;

        // Actualizar nombre y apellidos si se proporcionan
        if (updateProfileDto.getNombre() != null && !updateProfileDto.getNombre().isEmpty()) {
            user.setNombre(updateProfileDto.getNombre());
            profileDataChanged = true;
        }

        if (updateProfileDto.getApellidoPaterno() != null && !updateProfileDto.getApellidoPaterno().isEmpty()) {
            user.setApellidoPaterno(updateProfileDto.getApellidoPaterno());
            profileDataChanged = true;
        }

        if (updateProfileDto.getApellidoMaterno() != null) {
            user.setApellidoMaterno(updateProfileDto.getApellidoMaterno());
            profileDataChanged = true;
        }

        if (updateProfileDto.getUsername() != null && !updateProfileDto.getUsername().isEmpty()) {
            user.setUsername(updateProfileDto.getUsername());
            profileDataChanged = true;
        }

        // Actualizar email si cambió
        if (updateProfileDto.getEmail() != null && !updateProfileDto.getEmail().equals(currentEmail)) {
            if (userRepository.findByEmail(updateProfileDto.getEmail()).isPresent()) {
                throw new Exception("El correo electrónico ya está en uso.");
            }
            user.setEmail(updateProfileDto.getEmail());
            emailChanged = true;
        }

        // Actualizar contraseña si se proporciona
        if (updateProfileDto.getNewPassword() != null && !updateProfileDto.getNewPassword().isEmpty()) {
            if (updateProfileDto.getCurrentPassword() == null
                    || !passwordEncoder.matches(updateProfileDto.getCurrentPassword(), user.getPassword())) {
                throw new Exception("La contraseña actual es incorrecta.");
            }
            user.setPassword(passwordEncoder.encode(updateProfileDto.getNewPassword()));
            passwordChanged = true;
        }

        User savedUser = userRepository.save(user);

        // Publicar evento de perfil actualizado
        if (emailChanged || passwordChanged || profileDataChanged) {
            eventPublisher.publishEvent(new UserProfileUpdatedEvent(this,
                    savedUser.getId(),
                    currentEmail,
                    emailChanged ? updateProfileDto.getEmail() : currentEmail,
                    passwordChanged));
        }

        return savedUser;
    }

    public void changePassword(String email, String currentPassword, String newPassword) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new Exception("La contraseña actual es incorrecta.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<User> listAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
    }

    @Transactional
    public User updateUserActive(Long id, Boolean active) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        if (active != null)
            user.setActive(active);
        return userRepository.save(user);
    }

    @Transactional
    public void assignOrganizerRole(Long userId, boolean assign) throws Exception {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Usuario no encontrado."));
        String targetRoleName = assign ? AppConstants.ROLE_ORGANIZADOR : AppConstants.ROLE_JUGADOR;
        Role role = roleRepository.findByName(targetRoleName)
                .orElseThrow(() -> new Exception("Rol no encontrado: " + targetRoleName));
        user.setRole(role);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfileWithTeam(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con el email: " + email));
        return buildUserProfileDto(user);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getUserProfileById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con el ID: " + id));
        return buildUserProfileDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserProfileDto> getAllUsersWithTeams() {
        return userRepository.findAll().stream()
                .map(this::buildUserProfileDto)
                .toList();
    }

    private UserProfileDto buildUserProfileDto(User user) {
        System.out.println("🔍 DEBUG buildUserProfileDto para usuario: " + user.getEmail());
        System.out.println("📋 Nombre: " + user.getNombre());
        System.out.println("📋 ApellidoPaterno: " + user.getApellidoPaterno());
        System.out.println("📋 ApellidoMaterno: " + user.getApellidoMaterno());

        UserProfileDto dto = new UserProfileDto();
        dto.setId(user.getId());
        dto.setNombre(user.getNombre());
        dto.setApellidoPaterno(user.getApellidoPaterno());
        dto.setApellidoMaterno(user.getApellidoMaterno());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setRole(user.getRole().getName());
        dto.setWins(user.getWins() != null ? user.getWins() : 0);
        dto.setLosses(user.getLosses() != null ? user.getLosses() : 0);

        // Buscar el equipo del que es miembro
        try {
            Team memberTeam = findTeamByMember(user);
            System.out.println("🏆 Equipo como miembro: " + (memberTeam != null ? memberTeam.getName() : "NULL"));
            if (memberTeam != null) {
                dto.setTeam(new TeamInfoDto(memberTeam.getId(), memberTeam.getName(),
                        memberTeam.getDescription(), memberTeam.getLogoUrl()));
            }
        } catch (Exception e) {
            System.out.println("❌ Error buscando equipo como miembro: " + e.getMessage());
        }

        // Buscar el equipo del que es propietario
        try {
            Team ownedTeam = findTeamByOwner(user);
            System.out.println("👑 Equipo como propietario: " + (ownedTeam != null ? ownedTeam.getName() : "NULL"));
            if (ownedTeam != null) {
                dto.setOwnedTeam(new TeamInfoDto(ownedTeam.getId(), ownedTeam.getName(),
                        ownedTeam.getDescription(), ownedTeam.getLogoUrl()));
            }
        } catch (Exception e) {
            System.out.println("❌ Error buscando equipo como propietario: " + e.getMessage());
        }

        return dto;
    }

    private Team findTeamByMember(User user) {
        // Buscar en todos los equipos si el usuario es miembro
        return userRepository.findTeamByMemberId(user.getId());
    }

    private Team findTeamByOwner(User user) {
        // Buscar el equipo del que es propietario
        return userRepository.findTeamByOwnerId(user.getId());
    }
}
