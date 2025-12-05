package mx.edu.utez.ligamerbackend.controllers;

import mx.edu.utez.ligamerbackend.dtos.ChangePasswordDto;
import mx.edu.utez.ligamerbackend.dtos.UpdateProfileDto;
import mx.edu.utez.ligamerbackend.dtos.UserProfileDto;
import mx.edu.utez.ligamerbackend.dtos.ApiResponseDto;
import mx.edu.utez.ligamerbackend.models.User;
import mx.edu.utez.ligamerbackend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponseDto<UserProfileDto>> getProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();

            UserProfileDto profile = userService.getUserProfileWithTeam(email);

            return ResponseEntity.ok(ApiResponseDto.success("Perfil obtenido exitosamente", profile));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.badRequest("Error al obtener el perfil: " + e.getMessage()));
        }
    }

    @PutMapping
    public ResponseEntity<ApiResponseDto<UserProfileDto>> updateProfile(@RequestBody UpdateProfileDto updateProfileDto) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentEmail = authentication.getName();

            User updatedUser = userService.updateProfile(currentEmail, updateProfileDto);
            UserProfileDto profile = userService.getUserProfileWithTeam(updatedUser.getEmail());

            return ResponseEntity.ok(ApiResponseDto.success("Perfil actualizado exitosamente", profile));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.badRequest("Error al actualizar el perfil: " + e.getMessage()));
        }
    }

    // Nuevo endpoint para que organizadores y administradores puedan ver perfil de cualquier usuario por ID
    @GetMapping("/user/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZADOR', 'ROLE_ADMINISTRADOR')")
    public ResponseEntity<ApiResponseDto<UserProfileDto>> getUserById(@PathVariable Long id) {
        try {
            UserProfileDto profile = userService.getUserProfileById(id);
            return ResponseEntity.ok(ApiResponseDto.success("Usuario obtenido exitosamente", profile));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponseDto.notFound("Error al obtener el usuario: " + e.getMessage()));
        }
    }

    // Nuevo endpoint para que organizadores y administradores puedan listar todos los usuarios
    @GetMapping("/users")
    @PreAuthorize("hasAnyAuthority('ROLE_ORGANIZADOR', 'ROLE_ADMINISTRADOR')")
    public ResponseEntity<ApiResponseDto<List<UserProfileDto>>> getAllUsers() {
        try {
            List<UserProfileDto> users = userService.getAllUsersWithTeams();
            return ResponseEntity.ok(ApiResponseDto.success("Usuarios obtenidos exitosamente", users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDto.error("Error al obtener los usuarios: " + e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<ApiResponseDto<String>> changePassword(@RequestBody ChangePasswordDto changePasswordDto) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = authentication.getName();
            userService.changePassword(email, changePasswordDto.getCurrentPassword(), changePasswordDto.getNewPassword());
            return ResponseEntity.ok(ApiResponseDto.success("Contraseña actualizada exitosamente", "OK"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.badRequest("Error al cambiar la contraseña: " + e.getMessage()));
        }
    }
}
