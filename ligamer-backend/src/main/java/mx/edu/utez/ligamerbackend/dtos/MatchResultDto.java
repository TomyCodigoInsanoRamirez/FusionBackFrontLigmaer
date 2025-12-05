package mx.edu.utez.ligamerbackend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchResultDto {
    private Integer homeScore;
    private Integer awayScore;
    private String status; // FINISHED, IN_PROGRESS, CANCELLED

    public MatchResultDto(Integer homeScore, Integer awayScore) {
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.status = "FINISHED";
    }
}
