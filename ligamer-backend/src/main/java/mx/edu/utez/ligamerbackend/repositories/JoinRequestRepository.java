package mx.edu.utez.ligamerbackend.repositories;

import mx.edu.utez.ligamerbackend.models.JoinRequest;
import mx.edu.utez.ligamerbackend.models.Team;
import mx.edu.utez.ligamerbackend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    Optional<JoinRequest> findByTeamAndUser(Team team, User user);
    List<JoinRequest> findAllByTeamAndStatus(Team team, String status);
    List<JoinRequest> findAllByTeam(Team team);
}
