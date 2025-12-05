package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StandingDto {
    private Long id;
    private String teamName;
    private Long teamId;
    private Integer played;
    private Integer won;
    private Integer drawn;
    private Integer lost;
    private Integer goalsFor;
    private Integer goalsAgainst;
    private Integer goalDifference;
    private Integer points;
    private Integer position;

    public StandingDto() {
    }

    public StandingDto(Long id, String teamName, Long teamId, Integer played, Integer won, 
                       Integer drawn, Integer lost, Integer goalsFor, Integer goalsAgainst, Integer points) {
        this.id = id;
        this.teamName = teamName;
        this.teamId = teamId;
        this.played = played;
        this.won = won;
        this.drawn = drawn;
        this.lost = lost;
        this.goalsFor = goalsFor;
        this.goalsAgainst = goalsAgainst;
        this.goalDifference = goalsFor - goalsAgainst;
        this.points = points;
    }
}
