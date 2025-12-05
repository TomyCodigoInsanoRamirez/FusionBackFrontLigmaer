package mx.edu.utez.ligamerbackend.repositories;

import mx.edu.utez.ligamerbackend.models.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import mx.edu.utez.ligamerbackend.models.User;
import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByCreatedBy(User user);
}
