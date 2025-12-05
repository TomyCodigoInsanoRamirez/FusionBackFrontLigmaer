package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PieDataDto {
    private Long id;
    private Integer value;
    private String label;
    private String color;
}

