package mx.edu.utez.ligamerbackend.repositories;

import mx.edu.utez.ligamerbackend.models.TournamentJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TournamentJoinRequestRepository extends JpaRepository<TournamentJoinRequest, Long> {
    List<TournamentJoinRequest> findByTournamentId(Long tournamentId);

    Optional<TournamentJoinRequest> findByTournamentIdAndTeamId(Long tournamentId, Long teamId);

    List<TournamentJoinRequest> findByTeamId(Long teamId);

    List<TournamentJoinRequest> findByTournament_CreatedBy_EmailAndStatus(String email, String status);
}
