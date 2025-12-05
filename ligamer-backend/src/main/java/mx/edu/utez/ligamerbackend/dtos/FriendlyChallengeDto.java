package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FriendlyChallengeDto {
    private Long challengerTeamId;
    private Long challengedTeamId;
    private String date; // YYYY-MM-DD or ISO
}
