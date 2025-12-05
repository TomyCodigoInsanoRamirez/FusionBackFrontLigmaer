package mx.edu.utez.ligamerbackend.repositories;

import mx.edu.utez.ligamerbackend.models.Match;
import mx.edu.utez.ligamerbackend.models.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findByTournamentOrderByMatchDateAsc(Tournament tournament);

    List<Match> findByTournamentAndStatus(Tournament tournament, String status);

    @Modifying
    @Transactional
    @Query("DELETE FROM Match m WHERE m.tournament = :tournament")
    void deleteByTournament(@Param("tournament") Tournament tournament);

    @Query("SELECT COUNT(m) FROM Match m WHERE m.status = 'FINISHED' AND " +
            "((m.homeTeam.id = :teamId AND m.homeScore > m.awayScore) OR " +
            "(m.awayTeam.id = :teamId AND m.awayScore > m.homeScore))")
    Integer countTotalWins(@Param("teamId") Long teamId);

    @Query("SELECT COUNT(m) FROM Match m WHERE m.status = 'FINISHED' AND " +
            "((m.homeTeam.id = :teamId AND m.homeScore < m.awayScore) OR " +
            "(m.awayTeam.id = :teamId AND m.awayScore < m.homeScore))")
    Integer countTotalLosses(@Param("teamId") Long teamId);
}
