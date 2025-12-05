package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TournamentDto {
    private String name;
    private String description;
    private String rules;
    private LocalDate startDate;
    private LocalDate endDate;
}
