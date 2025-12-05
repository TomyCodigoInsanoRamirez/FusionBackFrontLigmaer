package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerStatDto {
    private Long id;
    private String nombre;
    private Integer victorias;
    private Integer derrotas;
}

