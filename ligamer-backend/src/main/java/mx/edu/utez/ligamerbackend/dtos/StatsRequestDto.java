package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StatsRequestDto {
    private Long teamId;
    private Long tournamentId;
}
