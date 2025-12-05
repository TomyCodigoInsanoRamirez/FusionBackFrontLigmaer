package mx.edu.utez.ligamerbackend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamInfoDto {
    private Long id;
    private String name;
    private String description;
    private String logoUrl;
}