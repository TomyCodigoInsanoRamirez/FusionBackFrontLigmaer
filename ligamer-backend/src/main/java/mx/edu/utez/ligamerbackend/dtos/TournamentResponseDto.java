package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TournamentResponseDto {
    private Long id;
    private String name;
    private String description;
    private String rules;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private String createdByEmail;
}
