package mx.edu.utez.ligamerbackend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private Long id;
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String username;
    private String email;
    private boolean active;
    private String role;
    private TeamInfoDto team;
    private TeamInfoDto ownedTeam;
    private Integer wins;
    private Integer losses;
}