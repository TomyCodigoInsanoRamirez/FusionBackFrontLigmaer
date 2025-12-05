package mx.edu.utez.ligamerbackend.services;

import mx.edu.utez.ligamerbackend.dtos.ChallengeDto;
import mx.edu.utez.ligamerbackend.dtos.MatchDto;
import mx.edu.utez.ligamerbackend.models.Match;
import mx.edu.utez.ligamerbackend.models.Team;
import mx.edu.utez.ligamerbackend.models.Tournament;
import mx.edu.utez.ligamerbackend.models.User;
import mx.edu.utez.ligamerbackend.repositories.MatchRepository;
import mx.edu.utez.ligamerbackend.repositories.TeamRepository;
import mx.edu.utez.ligamerbackend.repositories.TournamentRepository;
import mx.edu.utez.ligamerbackend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional
public class MatchService {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    public MatchDto createChallenge(ChallengeDto dto, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // Validar equipos
        Team challenger = teamRepository.findById(dto.getChallengerTeamId())
                .orElseThrow(() -> new RuntimeException("Equipo retador no encontrado."));
        Team challenged = teamRepository.findById(dto.getChallengedTeamId())
                .orElseThrow(() -> new RuntimeException("Equipo retado no encontrado."));

        // Validar que el usuario sea dueño o miembro del equipo retador
        boolean isMember = challenger.getOwner().getEmail().equals(requesterEmail) ||
                (challenger.getMembers() != null
                        && challenger.getMembers().stream().anyMatch(m -> m.getEmail().equals(requesterEmail)));

        if (!isMember) {
            throw new RuntimeException("No tienes permiso para retar en nombre de este equipo.");
        }

        // Validar torneo
        Tournament tournament = tournamentRepository.findById(dto.getTournamentId())
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        Match match = new Match();
        match.setTournament(tournament);
        match.setHomeTeam(challenger);
        match.setAwayTeam(challenged);
        match.setHomeScore(0);
        match.setAwayScore(0);
        match.setStatus("PENDING");

        if (dto.getDate() != null) {
            try {
                if (dto.getDate().length() == 10) {
                    match.setMatchDate(LocalDate.parse(dto.getDate()).atStartOfDay());
                } else {
                    match.setMatchDate(LocalDateTime.parse(dto.getDate()));
                }
            } catch (Exception e) {
                match.setMatchDate(LocalDateTime.now().plusDays(1)); // Default mañana
            }
        } else {
            match.setMatchDate(LocalDateTime.now().plusDays(1));
        }

        Match saved = matchRepository.save(match);
        return toDto(saved);
    }

    public MatchDto createFriendlyChallenge(mx.edu.utez.ligamerbackend.dtos.FriendlyChallengeDto dto,
            String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // Validar equipos
        Team challenger = teamRepository.findById(dto.getChallengerTeamId())
                .orElseThrow(() -> new RuntimeException("Equipo retador no encontrado."));
        Team challenged = teamRepository.findById(dto.getChallengedTeamId())
                .orElseThrow(() -> new RuntimeException("Equipo retado no encontrado."));

        // Validar que el usuario sea dueño o miembro del equipo retador
        boolean isMember = challenger.getOwner().getEmail().equals(requesterEmail) ||
                (challenger.getMembers() != null
                        && challenger.getMembers().stream().anyMatch(m -> m.getEmail().equals(requesterEmail)));

        if (!isMember) {
            throw new RuntimeException("No tienes permiso para retar en nombre de este equipo.");
        }

        Match match = new Match();
        match.setTournament(null); // Partido amistoso
        match.setHomeTeam(challenger);
        match.setAwayTeam(challenged);
        match.setHomeScore(0);
        match.setAwayScore(0);
        match.setStatus("PENDING_APPROVAL"); // Esperando aceptación

        if (dto.getDate() != null) {
            try {
                if (dto.getDate().length() == 10) {
                    match.setMatchDate(LocalDate.parse(dto.getDate()).atStartOfDay());
                } else {
                    match.setMatchDate(LocalDateTime.parse(dto.getDate()));
                }
            } catch (Exception e) {
                match.setMatchDate(LocalDateTime.now().plusDays(1));
            }
        } else {
            match.setMatchDate(LocalDateTime.now().plusDays(1));
        }

        Match saved = matchRepository.save(match);
        return toDto(saved);
    }

    public MatchDto respondToFriendlyChallenge(Long matchId, String action, String requesterEmail) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Reto no encontrado."));

        if (!"PENDING_APPROVAL".equals(match.getStatus())) {
            throw new RuntimeException("El reto no está pendiente de aprobación.");
        }

        // Validar que el usuario pertenezca al equipo RETADO (awayTeam)
        Team challenged = match.getAwayTeam();
        boolean isMember = challenged.getOwner().getEmail().equals(requesterEmail) ||
                (challenged.getMembers() != null
                        && challenged.getMembers().stream().anyMatch(m -> m.getEmail().equals(requesterEmail)));

        if (!isMember) {
            throw new RuntimeException("No tienes permiso para responder a este reto.");
        }

        if ("ACCEPT".equalsIgnoreCase(action)) {
            match.setStatus("PENDING"); // Aceptado, listo para jugar
        } else if ("REJECT".equalsIgnoreCase(action)) {
            match.setStatus("REJECTED");
        } else {
            throw new RuntimeException("Acción inválida. Use ACCEPT o REJECT.");
        }

        Match saved = matchRepository.save(match);
        return toDto(saved);
    }

    public java.util.List<MatchDto> getPendingFriendlyChallenges(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));

        // Buscar partidos donde el equipo es awayTeam (retado) y status es
        // PENDING_APPROVAL
        java.util.List<Match> matches = matchRepository.findAll().stream()
                .filter(m -> m.getAwayTeam().getId().equals(teamId) && "PENDING_APPROVAL".equals(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        return matches.stream().map(this::toDto).collect(java.util.stream.Collectors.toList());
    }

    private MatchDto toDto(Match match) {
        MatchDto dto = new MatchDto();
        dto.setId(match.getId());
        dto.setHomeTeamName(match.getHomeTeam().getName());
        dto.setAwayTeamName(match.getAwayTeam().getName());
        dto.setHomeTeamId(match.getHomeTeam().getId());
        dto.setAwayTeamId(match.getAwayTeam().getId());
        dto.setHomeScore(match.getHomeScore());
        dto.setAwayScore(match.getAwayScore());
        dto.setMatchDate(match.getMatchDate());
        dto.setStatus(match.getStatus());
        dto.setTournamentName(match.getTournament() != null ? match.getTournament().getName() : "Amistoso");
        return dto;
    }
}
