package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileDto {
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String username;
    private String email;
    private String currentPassword;
    private String newPassword;
}
