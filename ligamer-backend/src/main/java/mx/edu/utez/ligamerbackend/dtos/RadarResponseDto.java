package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RadarResponseDto {
    private List<PlayerStatDto> players;
    private Integer victoriasTotales;
    private Integer derrotasTotales;
}

