package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TournamentSummaryDto {
    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String estado;
    private int teamCount;
    private String organizerName;
}
