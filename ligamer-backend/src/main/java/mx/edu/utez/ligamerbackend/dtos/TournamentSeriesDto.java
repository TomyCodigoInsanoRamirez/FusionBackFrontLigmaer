package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TournamentSeriesDto {
    private Long id;
    private String torneo;
    private Integer encuentros;
    private Integer ganados;
    private Integer perdidos;
}

