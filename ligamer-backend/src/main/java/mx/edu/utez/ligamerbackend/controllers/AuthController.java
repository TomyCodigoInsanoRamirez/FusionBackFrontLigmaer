package mx.edu.utez.ligamerbackend.controllers;

import jakarta.validation.Valid;
import mx.edu.utez.ligamerbackend.dtos.*;
import mx.edu.utez.ligamerbackend.services.JwtService;
import mx.edu.utez.ligamerbackend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody UserDto userDto, BindingResult bindingResult) {
        try {
            // Validar errores de validación
            if (bindingResult.hasErrors()) {
                String errors = bindingResult.getAllErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .collect(Collectors.joining(", "));
                return new ResponseEntity<>(errors, HttpStatus.BAD_REQUEST);
            }

            userService.registerNewUser(userDto);
            return new ResponseEntity<>("¡Bienvenido! Tu cuenta ha sido creada exitosamente.", HttpStatus.CREATED);
        } catch (Exception e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("message", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<JwtAuthResponseDto> loginUser(@RequestBody LoginDto loginDto) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(new JwtAuthResponseDto(token));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordDto forgotPasswordDto) {
        System.out.println("!!! --- INTENTANDO ENTRAR A FORGOT-PASSWORD --- !!!");
        try {
            userService.generatePasswordResetToken(forgotPasswordDto.getEmail());
            String successMessage = "Hemos enviado un enlace a tu correo para restablecer tu contraseña. Haz clic en él para seguir con el proceso.";
            return new ResponseEntity<>(successMessage, HttpStatus.OK);
        } catch (Exception e) {
            System.out.println("!!! --- ERROR ATRAPADO EN EL CONTROLADOR --- !!!");
            e.printStackTrace();
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordDto resetPasswordDto) {
        try {
            userService.resetPassword(resetPasswordDto.getToken(), resetPasswordDto.getNewPassword());
            // Mensaje de éxito según los criterios de aceptación [cite: 127]
            String successMessage = "Tu contraseña ha sido actualizada. Ya puedes iniciar sesión.";
            return new ResponseEntity<>(successMessage, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}