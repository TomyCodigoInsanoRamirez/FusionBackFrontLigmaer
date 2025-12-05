package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MatchDto {
    private Long id;
    private String homeTeamName;
    private Long homeTeamId;
    private String awayTeamName;
    private Long awayTeamId;
    private Integer homeScore;
    private Integer awayScore;
    private LocalDateTime matchDate;
    private String status; // PENDING, IN_PROGRESS, FINISHED, CANCELLED
    private String tournamentName;
}
