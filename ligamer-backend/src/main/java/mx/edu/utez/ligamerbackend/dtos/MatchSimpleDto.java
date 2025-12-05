package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MatchSimpleDto {
    private String team1;
    private String team2;
    private String score1;
    private String score2;
    private String date;
}

