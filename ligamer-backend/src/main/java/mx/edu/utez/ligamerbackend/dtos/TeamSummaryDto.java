package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamSummaryDto {
    private Long id;
    private String name;
    private String ownerEmail;
}
