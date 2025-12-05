package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChallengeDto {
    private Long challengerTeamId;
    private Long challengedTeamId;
    private Long tournamentId;
    private String date; // YYYY-MM-DD or ISO
}
