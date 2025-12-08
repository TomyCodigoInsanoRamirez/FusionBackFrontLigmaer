package mx.edu.utez.ligamerbackend.services;

import mx.edu.utez.ligamerbackend.dtos.TournamentDto;
import mx.edu.utez.ligamerbackend.dtos.TournamentResponseDto;
import mx.edu.utez.ligamerbackend.models.Tournament;
import mx.edu.utez.ligamerbackend.models.User;
import mx.edu.utez.ligamerbackend.repositories.TournamentRepository;
import mx.edu.utez.ligamerbackend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashSet;
import java.util.Set;
import mx.edu.utez.ligamerbackend.dtos.TournamentDetailResponseDto;
import mx.edu.utez.ligamerbackend.models.Team;
import mx.edu.utez.ligamerbackend.repositories.TeamRepository;
import mx.edu.utez.ligamerbackend.utils.AppConstants;
import mx.edu.utez.ligamerbackend.dtos.StandingDto;
import mx.edu.utez.ligamerbackend.dtos.MatchDto;
import mx.edu.utez.ligamerbackend.dtos.MatchResultDto;
import mx.edu.utez.ligamerbackend.models.Standing;
import mx.edu.utez.ligamerbackend.models.Match;
import mx.edu.utez.ligamerbackend.repositories.StandingRepository;
import mx.edu.utez.ligamerbackend.repositories.MatchRepository;
import mx.edu.utez.ligamerbackend.dtos.PlayerStatDto;
import mx.edu.utez.ligamerbackend.dtos.TournamentSummaryDto;
import mx.edu.utez.ligamerbackend.dtos.TournamentFullDto;
import mx.edu.utez.ligamerbackend.dtos.TournamentUpdateDto;
import mx.edu.utez.ligamerbackend.dtos.MatchSimpleDto;
import mx.edu.utez.ligamerbackend.dtos.TeamSimpleDto;
import java.time.LocalDate;

@Service
@Transactional
public class TournamentService {

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private StandingRepository standingRepository;

    @Autowired
    private MatchRepository matchRepository;

    public TournamentResponseDto createTournament(TournamentDto dto, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Usuario creador no encontrado"));

        Tournament t = new Tournament();
        t.setName(dto.getName());
        t.setDescription(dto.getDescription());
        t.setRules(dto.getRules());
        t.setStartDate(dto.getStartDate());
        t.setEndDate(dto.getEndDate());
        t.setActive(true);
        t.setCreatedBy(creator);

        Tournament saved = tournamentRepository.save(t);
        return toDto(saved);
    }

    // --- Nuevo: crear torneo completo a partir de TournamentFullDto ---
    public TournamentFullDto createFullTournament(TournamentFullDto dto, String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Usuario creador no encontrado"));

        Tournament t = new Tournament();
        t.setName(dto.getTournamentName());
        t.setDescription(dto.getDescription());
        // Guardamos rules como texto si viene ruleList
        if (dto.getRuleList() != null) {
            t.setRuleList(dto.getRuleList());
            t.setRules(String.join("\n", dto.getRuleList()));
        } else {
            t.setRules(null);
        }
        t.setStartDate(dto.getStartDate());
        t.setEndDate(dto.getEndDate());
        t.setNumTeams(dto.getNumTeams());
        t.setRegistrationCloseDate(dto.getRegistrationCloseDate());
        t.setMatchDates(dto.getMatchDates());
        t.setEstado(dto.getEstado());
        t.setCreatedBy(creator);
        t.setActive(true);

        // Guardar equipos si vienen (mapear por nombre a entidades existentes o crear
        // nuevas)
        if (dto.getTeams() != null) {
            for (TeamSimpleDto ts : dto.getTeams()) {
                Team team = null;
                if (ts.getId() != null) {
                    team = teamRepository.findById(ts.getId()).orElse(null);
                }
                if (team == null) {
                    team = teamRepository.findByName(ts.getName()).orElseGet(() -> {
                        Team newTeam = new Team();
                        newTeam.setName(ts.getName());
                        return teamRepository.save(newTeam);
                    });
                }
                t.getTeams().add(team);
            }
        }

        Tournament saved = tournamentRepository.save(t);

        // Guardar partidos si vienen
        if (dto.getMatches() != null) {
            for (java.util.Map.Entry<String, MatchSimpleDto> entry : dto.getMatches().entrySet()) {
                String nodeId = entry.getKey();
                MatchSimpleDto mDto = entry.getValue();

                Match match = new Match();
                match.setTournament(saved);
                match.setNodeId(nodeId);

                // Buscar equipos por nombre
                Team homeTeam = teamRepository.findByName(mDto.getTeam1())
                        .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + mDto.getTeam1()));
                Team awayTeam = teamRepository.findByName(mDto.getTeam2())
                        .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + mDto.getTeam2()));

                match.setHomeTeam(homeTeam);
                match.setAwayTeam(awayTeam);

                // Parsear scores
                try {
                    match.setHomeScore(
                            mDto.getScore1() != null && !mDto.getScore1().isEmpty() ? Integer.parseInt(mDto.getScore1())
                                    : 0);
                    match.setAwayScore(
                            mDto.getScore2() != null && !mDto.getScore2().isEmpty() ? Integer.parseInt(mDto.getScore2())
                                    : 0);
                } catch (NumberFormatException e) {
                    match.setHomeScore(0);
                    match.setAwayScore(0);
                }

                // Parsear fecha
                if (mDto.getDate() != null && !mDto.getDate().isEmpty()) {
                    try {
                        if (mDto.getDate().length() == 10) {
                            match.setMatchDate(java.time.LocalDate.parse(mDto.getDate()).atStartOfDay());
                        } else {
                            match.setMatchDate(java.time.LocalDateTime.parse(mDto.getDate()));
                        }
                    } catch (Exception e) {
                        match.setMatchDate(t.getStartDate().atStartOfDay());
                    }
                } else {
                    match.setMatchDate(t.getStartDate().atStartOfDay());
                }

                // Status
                if ((mDto.getScore1() == null || mDto.getScore1().isEmpty()) &&
                        (mDto.getScore2() == null || mDto.getScore2().isEmpty())) {
                    match.setStatus("PENDING");
                } else {
                    match.setStatus("FINISHED");
                }

                matchRepository.save(match);
            }
        }

        return toFullDto(saved);
    }

    public TournamentFullDto createFromCreateDto(mx.edu.utez.ligamerbackend.dtos.TournamentCreateDto dto,
            String creatorEmail) {
        User creator = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new RuntimeException("Usuario creador no encontrado"));

        Tournament t = new Tournament();
        t.setName(dto.getTournamentName());
        t.setDescription(dto.getDescription());
        // Guardamos rules como texto si viene ruleList
        if (dto.getRuleList() != null) {
            t.setRuleList(dto.getRuleList());
            t.setRules(String.join("\n", dto.getRuleList()));
        } else {
            t.setRules(null);
        }
        t.setStartDate(dto.getStartDate());
        t.setEndDate(dto.getEndDate());
        t.setNumTeams(dto.getNumTeams());
        t.setRegistrationCloseDate(dto.getRegistrationCloseDate());
        t.setMatchDates(dto.getMatchDates());
        t.setEstado(dto.getEstado());
        if (dto.getChampionTeamId() != null) {
            Team champion = teamRepository.findById(dto.getChampionTeamId())
                    .orElseThrow(() -> new RuntimeException("Equipo campeón no encontrado"));
            t.setChampionTeam(champion);
            t.setChampionTeamName(champion.getName());
        } else if (dto.getChampionTeamName() != null) {
            Team champion = teamRepository.findByName(dto.getChampionTeamName()).orElse(null);
            t.setChampionTeam(champion);
            t.setChampionTeamName(dto.getChampionTeamName());
        }
        t.setCreatedBy(creator);
        t.setActive(true);

        // Guardar equipos si vienen (mapear por nombre a entidades existentes o crear
        // nuevas)
        if (dto.getTeams() != null) {
            for (TeamSimpleDto ts : dto.getTeams()) {
                Team team = null;
                if (ts.getId() != null) {
                    team = teamRepository.findById(ts.getId()).orElse(null);
                }
                if (team == null) {
                    team = teamRepository.findByName(ts.getName()).orElseGet(() -> {
                        Team newTeam = new Team();
                        newTeam.setName(ts.getName());
                        return teamRepository.save(newTeam);
                    });
                }
                t.getTeams().add(team);
            }
        }

        Tournament saved = tournamentRepository.save(t);

        // Guardar partidos si vienen
        if (dto.getMatches() != null) {
            for (java.util.Map.Entry<String, MatchSimpleDto> entry : dto.getMatches().entrySet()) {
                String nodeId = entry.getKey();
                MatchSimpleDto mDto = entry.getValue();

                Match match = new Match();
                match.setTournament(saved);
                match.setNodeId(nodeId);

                // Buscar equipos por nombre
                Team homeTeam = teamRepository.findByName(mDto.getTeam1())
                        .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + mDto.getTeam1()));
                Team awayTeam = teamRepository.findByName(mDto.getTeam2())
                        .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + mDto.getTeam2()));

                match.setHomeTeam(homeTeam);
                match.setAwayTeam(awayTeam);

                // Parsear scores
                try {
                    match.setHomeScore(
                            mDto.getScore1() != null && !mDto.getScore1().isEmpty() ? Integer.parseInt(mDto.getScore1())
                                    : 0);
                    match.setAwayScore(
                            mDto.getScore2() != null && !mDto.getScore2().isEmpty() ? Integer.parseInt(mDto.getScore2())
                                    : 0);
                } catch (NumberFormatException e) {
                    match.setHomeScore(0);
                    match.setAwayScore(0);
                }

                // Parsear fecha
                if (mDto.getDate() != null && !mDto.getDate().isEmpty()) {
                    try {
                        if (mDto.getDate().length() == 10) {
                            match.setMatchDate(java.time.LocalDate.parse(mDto.getDate()).atStartOfDay());
                        } else {
                            match.setMatchDate(java.time.LocalDateTime.parse(mDto.getDate()));
                        }
                    } catch (Exception e) {
                        match.setMatchDate(t.getStartDate().atStartOfDay());
                    }
                } else {
                    match.setMatchDate(t.getStartDate().atStartOfDay());
                }

                // Status
                if ((mDto.getScore1() == null || mDto.getScore1().isEmpty()) &&
                        (mDto.getScore2() == null || mDto.getScore2().isEmpty())) {
                    match.setStatus("PENDING");
                } else {
                    match.setStatus("FINISHED");
                }

                matchRepository.save(match);
            }
        }

        return toFullDto(saved);
    }

    // Nuevo método público para obtener TournamentFullDto por id
    public TournamentFullDto getFullTournament(Long tournamentId) {
        Tournament t = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));
        return toFullDto(t);
    }

    @Transactional(readOnly = true)
    public TournamentDetailResponseDto getTournament(Long tournamentId) {
        Tournament t = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        TournamentFullDto full = toFullDto(t);

        TournamentDetailResponseDto dto = new TournamentDetailResponseDto();
        dto.setId(full.getId());
        dto.setName(full.getTournamentName());
        dto.setDescription(full.getDescription());
        // Preserve rules as text if available
        if (full.getRuleList() != null) {
            dto.setRules(String.join("\n", full.getRuleList()));
        } else {
            dto.setRules(null);
        }
        dto.setStartDate(full.getStartDate());
        dto.setEndDate(full.getEndDate());
        dto.setActive(true);
        dto.setCreatedByEmail(t.getCreatedBy() != null ? t.getCreatedBy().getEmail() : null);

        // Nuevos campos
        dto.setNumTeams(full.getNumTeams());
        dto.setRegistrationCloseDate(full.getRegistrationCloseDate());
        dto.setRuleList(full.getRuleList());
        dto.setMatchDates(full.getMatchDates());
        dto.setEstado(full.getEstado());
        dto.setGeneradoEl(full.getGeneradoEl());
        dto.setActualizadoEl(full.getActualizadoEl());
        dto.setTeams(full.getTeams());
        dto.setMatches(full.getMatches());

        return dto;
    }

    public TournamentFullDto updateTournament(Long tournamentId, TournamentDto dto, String requesterEmail)
            throws Exception {
        TournamentFullDto fullDto = new TournamentFullDto();
        fullDto.setTournamentName(dto.getName());
        fullDto.setDescription(dto.getDescription());
        if (dto.getRules() != null) {
            fullDto.setRuleList(java.util.Arrays.asList(dto.getRules().split("\n")));
        }
        fullDto.setStartDate(dto.getStartDate());
        fullDto.setEndDate(dto.getEndDate());
        return updateTournament(tournamentId, fullDto, requesterEmail);
    }

    public TournamentFullDto updateTournament(Long tournamentId, TournamentFullDto dto, String requesterEmail)
            throws Exception {
        // Verificar rol del solicitante
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario solicitante no encontrado."));

        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean allowed = AppConstants.ROLE_ORGANIZADOR.equals(roleName)
                || AppConstants.ROLE_ADMINISTRADOR.equals(roleName);
        if (!allowed)
            throw new Exception("No autorizado.");

        Tournament found = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        String previousEstado = found.getEstado() != null ? found.getEstado() : "";
        Team championFromDto = resolveChampionTeam(dto);

        if (dto.getTournamentName() != null)
            found.setName(dto.getTournamentName());
        if (dto.getDescription() != null)
            found.setDescription(dto.getDescription());
        if (dto.getRuleList() != null) {
            found.setRuleList(dto.getRuleList());
            found.setRules(String.join("\n", dto.getRuleList()));
        }
        if (dto.getStartDate() != null)
            found.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null)
            found.setEndDate(dto.getEndDate());
        if (dto.getRegistrationCloseDate() != null)
            found.setRegistrationCloseDate(dto.getRegistrationCloseDate());
        if (dto.getMatchDates() != null)
            found.setMatchDates(dto.getMatchDates());
        if (dto.getEstado() != null)
            found.setEstado(dto.getEstado());

        if (championFromDto != null || dto.getChampionTeamName() != null) {
            found.setChampionTeam(championFromDto);
            found.setChampionTeamName(championFromDto != null ? championFromDto.getName() : dto.getChampionTeamName());
        }

        if (championFromDto != null || dto.getChampionTeamName() != null) {
            found.setChampionTeam(championFromDto);
            found.setChampionTeamName(championFromDto != null ? championFromDto.getName() : dto.getChampionTeamName());
        }

        if (championFromDto != null || dto.getChampionTeamName() != null) {
            found.setChampionTeam(championFromDto);
            found.setChampionTeamName(championFromDto != null ? championFromDto.getName() : dto.getChampionTeamName());
        }

        // Actualizar partidos si vienen
        if (dto.getMatches() != null) {
            List<Match> existingMatches = matchRepository.findByTournamentOrderByMatchDateAsc(found);
            Map<String, Match> matchMap = existingMatches.stream()
                    .filter(m -> m.getNodeId() != null)
                    .collect(Collectors.toMap(Match::getNodeId, m -> m));

            for (Map.Entry<String, MatchSimpleDto> entry : dto.getMatches().entrySet()) {
                String nodeId = entry.getKey();
                MatchSimpleDto mDto = entry.getValue();
                Match match = matchMap.get(nodeId);

                if (match != null) {
                    // Actualizar fecha si cambió
                    if (mDto.getDate() != null && !mDto.getDate().isEmpty()) {
                        try {
                            if (mDto.getDate().length() == 10) {
                                match.setMatchDate(java.time.LocalDate.parse(mDto.getDate()).atStartOfDay());
                            } else {
                                match.setMatchDate(java.time.LocalDateTime.parse(mDto.getDate()));
                            }
                        } catch (Exception e) {
                            // Ignorar error de fecha
                        }
                    }

                    // Actualizar scores si vienen
                    if (mDto.getScore1() != null && mDto.getScore2() != null) {
                        try {
                            int newHomeScore = Integer.parseInt(mDto.getScore1());
                            int newAwayScore = Integer.parseInt(mDto.getScore2());

                            // Solo si cambiaron
                            if (match.getHomeScore() != newHomeScore || match.getAwayScore() != newAwayScore) {
                                Integer oldHomeScore = match.getHomeScore();
                                Integer oldAwayScore = match.getAwayScore();
                                boolean wasFinished = "FINISHED".equals(match.getStatus());

                                match.setHomeScore(newHomeScore);
                                match.setAwayScore(newAwayScore);

                                // Si ya estaba finalizado, revertir y aplicar
                                if (wasFinished) {
                                    revertUserStatsForMatch(match, oldHomeScore, oldAwayScore);
                                    revertStandingsForMatch(match, oldHomeScore, oldAwayScore);
                                    updateStandingsForMatch(match);
                                } else {
                                    // Si estaba pendiente, finalizar y aplicar
                                    match.setStatus("FINISHED");
                                    updateStandingsForMatch(match);
                                }
                            }
                        } catch (NumberFormatException e) {
                            // Ignorar scores inválidos
                        }
                    }
                    matchRepository.save(match);
                }
            }
        }

        Tournament saved = tournamentRepository.save(found);
        return toFullDto(saved);
    }

    public List<TournamentSummaryDto> getMyTournaments(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        List<Tournament> tournaments = tournamentRepository.findByCreatedBy(user);

        return tournaments.stream().map(t -> {
            TournamentSummaryDto dto = new TournamentSummaryDto();
            dto.setId(t.getId());
            dto.setName(t.getName());
            dto.setDescription(t.getDescription());
            dto.setStartDate(t.getStartDate());
            dto.setEndDate(t.getEndDate());
            dto.setEstado(t.getEstado());
            dto.setTeamCount(t.getTeams() != null ? t.getTeams().size() : 0);
            return dto;
        }).collect(Collectors.toList());
    }

    // Nuevo método para actualización completa del torneo
    public TournamentFullDto updateFullTournament(Long tournamentId,
            mx.edu.utez.ligamerbackend.dtos.TournamentUpdateDto dto, String requesterEmail)
            throws Exception {
        System.out.println("🔧 ENTRANDO a updateFullTournament");
        System.out.println("🆔 TournamentId: " + tournamentId);
        System.out.println("👤 Email del usuario: " + requesterEmail);

        // Verificar rol del solicitante
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario solicitante no encontrado."));

        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        System.out.println("🎭 Rol del usuario: " + roleName);

        boolean allowed = AppConstants.ROLE_ORGANIZADOR.equals(roleName)
                || AppConstants.ROLE_ADMINISTRADOR.equals(roleName);
        System.out.println("✅ Usuario autorizado: " + allowed);

        if (!allowed) {
            System.out.println("❌ Error: No autorizado");
            throw new Exception("No autorizado.");
        }

        Tournament found = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        String previousEstado = found.getEstado() != null ? found.getEstado() : "";
        Team championFromDto = resolveChampionTeam(dto);

        // Actualizar campos básicos
        if (dto.getTournamentName() != null)
            found.setName(dto.getTournamentName());
        if (dto.getDescription() != null)
            found.setDescription(dto.getDescription());
        if (dto.getNumTeams() != null)
            found.setNumTeams(dto.getNumTeams());
        if (dto.getStartDate() != null)
            found.setStartDate(dto.getStartDate());
        if (dto.getEndDate() != null)
            found.setEndDate(dto.getEndDate());
        if (dto.getRegistrationCloseDate() != null)
            found.setRegistrationCloseDate(dto.getRegistrationCloseDate());
        if (dto.getRuleList() != null) {
            found.setRuleList(dto.getRuleList());
            found.setRules(String.join("\n", dto.getRuleList()));
        }
        if (dto.getMatchDates() != null)
            found.setMatchDates(dto.getMatchDates());
        if (dto.getEstado() != null)
            found.setEstado(dto.getEstado());

        if (championFromDto != null || dto.getChampionTeamName() != null) {
            found.setChampionTeam(championFromDto);
            found.setChampionTeamName(championFromDto != null ? championFromDto.getName() : dto.getChampionTeamName());
        }

        // Actualizar equipos
        if (dto.getTeams() != null) {
            found.getTeams().clear();
            for (TeamSimpleDto ts : dto.getTeams()) {
                Team team = null;
                if (ts.getId() != null) {
                    team = teamRepository.findById(ts.getId()).orElse(null);
                }
                if (team == null) {
                    team = teamRepository.findByName(ts.getName()).orElseGet(() -> {
                        Team newTeam = new Team();
                        newTeam.setName(ts.getName());
                        return teamRepository.save(newTeam);
                    });
                }
                found.getTeams().add(team);
            }
        }

        Tournament saved = tournamentRepository.save(found);

        // Actualizar partidos
        if (dto.getMatches() != null) {
            // 1) Revertir estadísticas de usuarios de los partidos previos finalizados
            List<Match> previousMatches = matchRepository.findByTournamentOrderByMatchDateAsc(saved);
            for (Match oldMatch : previousMatches) {
                if ("FINISHED".equals(oldMatch.getStatus())
                        && oldMatch.getHomeScore() != null && oldMatch.getAwayScore() != null) {
                    revertUserStatsForMatch(oldMatch, oldMatch.getHomeScore(), oldMatch.getAwayScore());
                }
            }

            // 2) Reiniciar standings existentes a cero para recalcular con los nuevos
            // resultados
            resetStandingsForTournament(saved);

            // 3) Eliminar partidos previos y recrearlos
            matchRepository.deleteByTournament(saved);

            List<Match> newMatches = new java.util.ArrayList<>();

            for (Map.Entry<String, MatchSimpleDto> entry : dto.getMatches().entrySet()) {
                String nodeId = entry.getKey();
                MatchSimpleDto ms = entry.getValue();

                if (ms.getTeam1() != null && ms.getTeam2() != null) {
                    Team homeTeam = teamRepository.findByName(ms.getTeam1())
                            .orElseThrow(() -> new RuntimeException("Equipo local no encontrado: " + ms.getTeam1()));
                    Team awayTeam = teamRepository.findByName(ms.getTeam2())
                            .orElseThrow(
                                    () -> new RuntimeException("Equipo visitante no encontrado: " + ms.getTeam2()));

                    Match match = new Match();
                    match.setTournament(saved);
                    match.setHomeTeam(homeTeam);
                    match.setAwayTeam(awayTeam);
                    match.setNodeId(nodeId);

                    if (ms.getDate() != null) {
                        match.setMatchDate(LocalDate.parse(ms.getDate()).atStartOfDay());
                    }

                    Integer homeScore = null;
                    Integer awayScore = null;

                    if (ms.getScore1() != null && !ms.getScore1().isEmpty()) {
                        try {
                            homeScore = Integer.parseInt(ms.getScore1());
                        } catch (NumberFormatException ignored) {
                            homeScore = 0;
                        }
                    }

                    if (ms.getScore2() != null && !ms.getScore2().isEmpty()) {
                        try {
                            awayScore = Integer.parseInt(ms.getScore2());
                        } catch (NumberFormatException ignored) {
                            awayScore = 0;
                        }
                    }

                    match.setHomeScore(homeScore != null ? homeScore : 0);
                    match.setAwayScore(awayScore != null ? awayScore : 0);

                    boolean hasScores = homeScore != null && awayScore != null;
                    match.setStatus(hasScores ? "FINISHED" : "PENDING");

                    Match savedMatch = matchRepository.save(match);
                    newMatches.add(savedMatch);
                }
            }

            // 4) Aplicar estadísticas para nuevos partidos finalizados (incluye victorias
            // de jugadores)
            for (Match match : newMatches) {
                if ("FINISHED".equals(match.getStatus())
                        && match.getHomeScore() != null && match.getAwayScore() != null) {
                    updateStandingsForMatch(match); // también actualiza victorias/derrotas de usuarios
                }
            }
        }

        boolean finalizedNow = isFinalizado(saved.getEstado()) && !isFinalizado(previousEstado);
        if (finalizedNow) {
            if (saved.getChampionTeam() == null && saved.getChampionTeamName() == null) {
                throw new RuntimeException("Se requiere especificar el equipo campeón para finalizar el torneo.");
            }
            if (saved.getChampionTeam() == null && saved.getChampionTeamName() != null) {
                Team champion = teamRepository.findByName(saved.getChampionTeamName()).orElse(null);
                saved.setChampionTeam(champion);
                tournamentRepository.save(saved);
                championFromDto = champion;
            }
            if (championFromDto != null) {
                Integer current = championFromDto.getTournamentsWon() != null ? championFromDto.getTournamentsWon() : 0;
                championFromDto.setTournamentsWon(current + 1);
                teamRepository.save(championFromDto);
            }
        }

        return toFullDto(saved);
    }

    public void deleteTournament(Long tournamentId) throws Exception {
        Tournament found = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));
        tournamentRepository.delete(found);
    }

    @Transactional(readOnly = true)
    public List<TournamentResponseDto> listAll() {
        return tournamentRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public TournamentFullDto toFullDto(Tournament t) {
        TournamentFullDto dto = new TournamentFullDto();
        dto.setId(t.getId());
        dto.setTournamentName(t.getName());
        dto.setDescription(t.getDescription());
        dto.setNumTeams(t.getNumTeams());
        dto.setStartDate(t.getStartDate());
        dto.setEndDate(t.getEndDate());
        dto.setRegistrationCloseDate(t.getRegistrationCloseDate());
        dto.setRuleList(t.getRuleList());
        dto.setMatchDates(t.getMatchDates());
        dto.setEstado(t.getEstado());
        dto.setGeneradoEl(t.getGeneradoEl());
        dto.setActualizadoEl(t.getActualizadoEl());
        dto.setChampionTeamId(t.getChampionTeam() != null ? t.getChampionTeam().getId() : null);
        dto.setChampionTeamName(t.getChampionTeamName());
        // Teams
        java.util.List<TeamSimpleDto> teams = new java.util.ArrayList<>();
        if (t.getTeams() != null) {
            for (Team team : t.getTeams()) {
                TeamSimpleDto ts = new TeamSimpleDto();
                ts.setId(team.getId());
                ts.setName(team.getName());
                ts.setImage(team.getLogoUrl());
                teams.add(ts);
            }
        }
        dto.setTeams(teams);

        // Matches: mapear desde matchRepository
        java.util.Map<String, MatchSimpleDto> matchesMap = new java.util.HashMap<>();
        java.util.List<Match> matches = matchRepository.findByTournamentOrderByMatchDateAsc(t);
        int nodeIndex = 0;
        for (Match m : matches) {
            MatchSimpleDto ms = new MatchSimpleDto();
            ms.setTeam1(m.getHomeTeam() != null ? m.getHomeTeam().getName() : null);
            ms.setTeam2(m.getAwayTeam() != null ? m.getAwayTeam().getName() : null);

            if ("PENDING".equals(m.getStatus())) {
                ms.setScore1("");
                ms.setScore2("");
            } else {
                ms.setScore1(m.getHomeScore() != null ? String.valueOf(m.getHomeScore()) : "");
                ms.setScore2(m.getAwayScore() != null ? String.valueOf(m.getAwayScore()) : "");
            }

            ms.setDate(m.getMatchDate() != null ? m.getMatchDate().toLocalDate().toString() : null);

            String key = m.getNodeId() != null ? m.getNodeId() : "node" + nodeIndex;
            matchesMap.put(key, ms);
            nodeIndex++;
        }
        dto.setMatches(matchesMap);

        return dto;
    }

    private Team resolveChampionTeam(TournamentFullDto dto) {
        if (dto == null)
            return null;
        if (dto.getChampionTeamId() != null)
            return teamRepository.findById(dto.getChampionTeamId()).orElse(null);
        if (dto.getChampionTeamName() != null)
            return teamRepository.findByName(dto.getChampionTeamName()).orElse(null);
        return null;
    }

    private Team resolveChampionTeam(TournamentUpdateDto dto) {
        if (dto == null)
            return null;
        if (dto.getChampionTeamId() != null)
            return teamRepository.findById(dto.getChampionTeamId()).orElse(null);
        if (dto.getChampionTeamName() != null)
            return teamRepository.findByName(dto.getChampionTeamName()).orElse(null);
        return null;
    }

    private boolean isFinalizado(String estado) {
        return estado != null && "Finalizado".equalsIgnoreCase(estado.trim());
    }

    @Transactional(readOnly = true)
    public java.util.List<TournamentFullDto> listAllFull() {
        return tournamentRepository.findAll().stream().map(this::toFullDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<mx.edu.utez.ligamerbackend.dtos.TournamentSummaryDto> getTournamentSummaries() {
        return tournamentRepository.findAll().stream().map(t -> {
            mx.edu.utez.ligamerbackend.dtos.TournamentSummaryDto dto = new mx.edu.utez.ligamerbackend.dtos.TournamentSummaryDto();
            dto.setId(t.getId());
            dto.setName(t.getName());
            dto.setDescription(t.getDescription());
            dto.setStartDate(t.getStartDate());
            dto.setEndDate(t.getEndDate());
            dto.setEstado(t.getEstado());
            dto.setTeamCount(t.getTeams() != null ? t.getTeams().size() : 0);
            return dto;
        }).collect(Collectors.toList());
    }

    private TournamentResponseDto toDto(Tournament t) {
        TournamentResponseDto r = new TournamentResponseDto();
        r.setId(t.getId());
        r.setName(t.getName());
        r.setDescription(t.getDescription());
        r.setRules(t.getRules());
        r.setStartDate(t.getStartDate());
        r.setEndDate(t.getEndDate());
        r.setActive(t.isActive());
        r.setCreatedByEmail(t.getCreatedBy() != null ? t.getCreatedBy().getEmail() : null);
        return r;
    }

    @Transactional(readOnly = true)
    public List<StandingDto> getStandings(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        List<Standing> standings = standingRepository
                .findByTournamentOrderByPointsDescGoalDifferenceDescGoalsForDesc(tournament);

        List<StandingDto> result = new java.util.ArrayList<>();
        int position = 1;
        for (Standing standing : standings) {
            StandingDto dto = new StandingDto(
                    standing.getId(),
                    standing.getTeam().getName(),
                    standing.getTeam().getId(),
                    standing.getPlayed(),
                    standing.getWon(),
                    standing.getDrawn(),
                    standing.getLost(),
                    standing.getGoalsFor(),
                    standing.getGoalsAgainst(),
                    standing.getPoints());
            dto.setPosition(position++);
            result.add(dto);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<MatchDto> getMatches(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        List<Match> matches = matchRepository.findByTournamentOrderByMatchDateAsc(tournament);

        return matches.stream().map(match -> {
            MatchDto dto = new MatchDto();
            dto.setId(match.getId());
            dto.setHomeTeamName(match.getHomeTeam().getName());
            dto.setHomeTeamId(match.getHomeTeam().getId());
            dto.setAwayTeamName(match.getAwayTeam().getName());
            dto.setAwayTeamId(match.getAwayTeam().getId());
            dto.setHomeScore(match.getHomeScore());
            dto.setAwayScore(match.getAwayScore());
            dto.setMatchDate(match.getMatchDate());
            dto.setStatus(match.getStatus());
            return dto;
        }).collect(Collectors.toList());
    }

    public void enrollTeam(Long tournamentId, Long teamId, String requesterEmail) throws Exception {
        // Verificar que el torneo existe
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        // Verificar que el equipo existe
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));

        // Verificar que el solicitante es el dueño del equipo
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (!team.getOwner().getId().equals(requester.getId())) {
            throw new RuntimeException("No estás autorizado. Solo el dueño del equipo puede inscribirse.");
        }

        // Verificar que el equipo no está ya inscrito
        if (tournament.getTeams().contains(team)) {
            throw new RuntimeException("El equipo ya está inscrito en este torneo.");
        }

        // Inscribir el equipo
        tournament.getTeams().add(team);
        team.getTournaments().add(tournament);
        tournamentRepository.save(tournament);
    }

    public void removeTeam(Long tournamentId, Long teamId, String requesterEmail) throws Exception {
        // Verificar que el torneo existe
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        // Verificar que el equipo existe
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));

        // Verificar que el equipo está inscrito en el torneo
        if (!tournament.getTeams().contains(team)) {
            throw new RuntimeException("El equipo no está inscrito en este torneo.");
        }

        // Obtener datos del solicitante
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // Verificar autorización: dueño del equipo u organizador/admin
        boolean isTeamOwner = team.getOwner().getId().equals(requester.getId());
        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean isOrganizerOrAdmin = AppConstants.ROLE_ORGANIZADOR.equals(roleName) ||
                AppConstants.ROLE_ADMINISTRADOR.equals(roleName);

        if (!isTeamOwner && !isOrganizerOrAdmin) {
            throw new RuntimeException("No estás autorizado para retirar este equipo del torneo.");
        }

        // Retirar el equipo
        tournament.getTeams().remove(team);
        team.getTournaments().remove(tournament);
        tournamentRepository.save(tournament);
    }

    public MatchDto registerMatchResult(Long matchId, MatchResultDto resultDto, String requesterEmail)
            throws Exception {
        // Verificar que el usuario es organizador o admin
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean isOrganizerOrAdmin = AppConstants.ROLE_ORGANIZADOR.equals(roleName) ||
                AppConstants.ROLE_ADMINISTRADOR.equals(roleName);

        if (!isOrganizerOrAdmin) {
            throw new RuntimeException("No estás autorizado. Solo organizadores pueden registrar resultados.");
        }

        // Verificar que el partido existe
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado."));

        // Validar que los marcadores sean válidos (no negativos)
        if (resultDto.getHomeScore() == null || resultDto.getAwayScore() == null) {
            throw new RuntimeException("Los marcadores (homeScore y awayScore) son obligatorios.");
        }

        if (resultDto.getHomeScore() < 0 || resultDto.getAwayScore() < 0) {
            throw new RuntimeException("Los marcadores no pueden ser negativos.");
        }

        // Si es el primer registro del resultado (status era PENDING o IN_PROGRESS)
        if ("PENDING".equals(match.getStatus()) || "IN_PROGRESS".equals(match.getStatus())) {
            // Actualizar scores
            match.setHomeScore(resultDto.getHomeScore());
            match.setAwayScore(resultDto.getAwayScore());

            // Establecer status
            if (resultDto.getStatus() != null) {
                match.setStatus(resultDto.getStatus());
            } else {
                match.setStatus("FINISHED");
            }

            // Actualizar estadísticas de los equipos (standings)
            updateStandingsForMatch(match);

            // Guardar el partido
            Match saved = matchRepository.save(match);

            // Convertir a DTO y retornar
            return matchToDto(saved);
        } else {
            throw new RuntimeException("El partido ya tiene un resultado registrado.");
        }
    }

    public MatchDto updateMatchResult(Long matchId, MatchResultDto resultDto, String requesterEmail) throws Exception {
        // Verificar que el usuario es organizador o admin
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean isOrganizerOrAdmin = AppConstants.ROLE_ORGANIZADOR.equals(roleName) ||
                AppConstants.ROLE_ADMINISTRADOR.equals(roleName);

        if (!isOrganizerOrAdmin) {
            throw new RuntimeException("No estás autorizado. Solo organizadores pueden actualizar resultados.");
        }

        // Verificar que el partido existe
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Partido no encontrado."));

        // Validar que los marcadores sean válidos
        if (resultDto.getHomeScore() == null || resultDto.getAwayScore() == null) {
            throw new RuntimeException("Los marcadores (homeScore y awayScore) son obligatorios.");
        }

        if (resultDto.getHomeScore() < 0 || resultDto.getAwayScore() < 0) {
            throw new RuntimeException("Los marcadores no pueden ser negativos.");
        }

        // Verificar que el partido tiene resultado previo
        if ("PENDING".equals(match.getStatus())) {
            throw new RuntimeException(
                    "El partido no tiene un resultado registrado aún. Use el endpoint POST para registrar.");
        }

        // Guardar scores anteriores para revertir estadísticas si es necesario
        Integer oldHomeScore = match.getHomeScore();
        Integer oldAwayScore = match.getAwayScore();

        // Actualizar scores
        match.setHomeScore(resultDto.getHomeScore());
        match.setAwayScore(resultDto.getAwayScore());

        // Actualizar status si se proporciona
        if (resultDto.getStatus() != null) {
            match.setStatus(resultDto.getStatus());
        }

        // Revertir estadísticas antiguas y aplicar las nuevas
        revertUserStatsForMatch(match, oldHomeScore, oldAwayScore);
        revertStandingsForMatch(match, oldHomeScore, oldAwayScore);
        updateStandingsForMatch(match);

        // Guardar el partido actualizado
        Match saved = matchRepository.save(match);

        return matchToDto(saved);
    }

    private void updateStandingsForMatch(Match match) {
        Tournament tournament = match.getTournament();
        Team homeTeam = match.getHomeTeam();
        Team awayTeam = match.getAwayTeam();

        // Obtener o crear standings para ambos equipos
        Standing homeStanding = standingRepository.findByTournamentAndTeamId(tournament, homeTeam.getId())
                .orElse(new Standing());
        Standing awayStanding = standingRepository.findByTournamentAndTeamId(tournament, awayTeam.getId())
                .orElse(new Standing());

        // Inicializar si no existen
        if (homeStanding.getId() == null) {
            homeStanding.setTournament(tournament);
            homeStanding.setTeam(homeTeam);
            homeStanding.setPlayed(0);
            homeStanding.setWon(0);
            homeStanding.setDrawn(0);
            homeStanding.setLost(0);
            homeStanding.setGoalsFor(0);
            homeStanding.setGoalsAgainst(0);
            homeStanding.setPoints(0);
        }

        if (awayStanding.getId() == null) {
            awayStanding.setTournament(tournament);
            awayStanding.setTeam(awayTeam);
            awayStanding.setPlayed(0);
            awayStanding.setWon(0);
            awayStanding.setDrawn(0);
            awayStanding.setLost(0);
            awayStanding.setGoalsFor(0);
            awayStanding.setGoalsAgainst(0);
            awayStanding.setPoints(0);
        }

        // Actualizar estadísticas
        homeStanding.updateFromMatch(match.getHomeScore(), match.getAwayScore(), true);
        awayStanding.updateFromMatch(match.getHomeScore(), match.getAwayScore(), false);

        // Guardar
        standingRepository.save(homeStanding);
        standingRepository.save(awayStanding);

        // Actualizar estadísticas de jugadores
        updateUserStatsForMatch(match);
    }

    private void revertStandingsForMatch(Match match, Integer oldHomeScore, Integer oldAwayScore) {
        Tournament tournament = match.getTournament();
        Team homeTeam = match.getHomeTeam();
        Team awayTeam = match.getAwayTeam();

        Standing homeStanding = standingRepository.findByTournamentAndTeamId(tournament, homeTeam.getId())
                .orElseThrow(() -> new RuntimeException("Standing del equipo local no encontrado."));
        Standing awayStanding = standingRepository.findByTournamentAndTeamId(tournament, awayTeam.getId())
                .orElseThrow(() -> new RuntimeException("Standing del equipo visitante no encontrado."));

        // Crear un match temporal con los scores antiguos para revertir
        Match oldMatch = new Match();
        oldMatch.setHomeScore(oldHomeScore);
        oldMatch.setAwayScore(oldAwayScore);

        // Revertir (usando lógica inversa)
        revertStandingStats(homeStanding, oldMatch, true);
        revertStandingStats(awayStanding, oldMatch, false);

        standingRepository.save(homeStanding);
        standingRepository.save(awayStanding);
    }

    private void updateUserStatsForMatch(Match match) {
        if (match == null || match.getHomeScore() == null || match.getAwayScore() == null) {
            return;
        }

        if (!"FINISHED".equals(match.getStatus())) {
            return;
        }

        if (match.getHomeScore().equals(match.getAwayScore())) {
            return; // Sin empates para estadísticas de jugador
        }

        boolean homeWins = match.getHomeScore() > match.getAwayScore();
        Team winner = homeWins ? match.getHomeTeam() : match.getAwayTeam();
        Team loser = homeWins ? match.getAwayTeam() : match.getHomeTeam();

        applyUserDelta(winner, 1, 0);
        applyUserDelta(loser, 0, 1);
    }

    private void revertUserStatsForMatch(Match match, Integer oldHomeScore, Integer oldAwayScore) {
        if (match == null || oldHomeScore == null || oldAwayScore == null) {
            return;
        }

        if (oldHomeScore.equals(oldAwayScore)) {
            return;
        }

        boolean homeWins = oldHomeScore > oldAwayScore;
        Team winner = homeWins ? match.getHomeTeam() : match.getAwayTeam();
        Team loser = homeWins ? match.getAwayTeam() : match.getHomeTeam();

        applyUserDelta(winner, -1, 0);
        applyUserDelta(loser, 0, -1);
    }

    private void applyUserDelta(Team team, int winDelta, int lossDelta) {
        if (team == null) {
            return;
        }

        Set<User> players = new HashSet<>();

        // Asegurar que las relaciones estén cargadas; si vienen perezosas, recargar
        // desde DB
        Team hydrated = team;
        try {
            if ((team.getMembers() == null || team.getMembers().isEmpty()) && team.getId() != null) {
                hydrated = teamRepository.findById(team.getId()).orElse(team);
            }
        } catch (Exception ignored) {
            // Si falla la recarga, seguimos con el objeto recibido
        }

        if (hydrated.getOwner() != null) {
            players.add(hydrated.getOwner());
        }
        if (hydrated.getMembers() != null) {
            players.addAll(hydrated.getMembers());
        }

        if (players.isEmpty()) {
            return;
        }

        for (User user : players) {
            int currentWins = user.getWins() != null ? user.getWins() : 0;
            int currentLosses = user.getLosses() != null ? user.getLosses() : 0;
            user.setWins(currentWins + winDelta);
            user.setLosses(currentLosses + lossDelta);
        }

        userRepository.saveAll(players);
    }

    private void revertStandingStats(Standing standing, Match oldMatch, boolean isHomeTeam) {
        int goalsFor = isHomeTeam ? oldMatch.getHomeScore() : oldMatch.getAwayScore();
        int goalsAgainst = isHomeTeam ? oldMatch.getAwayScore() : oldMatch.getHomeScore();

        standing.setGoalsFor(standing.getGoalsFor() - goalsFor);
        standing.setGoalsAgainst(standing.getGoalsAgainst() - goalsAgainst);
        standing.setPlayed(standing.getPlayed() - 1);

        if (goalsFor > goalsAgainst) {
            standing.setWon(standing.getWon() - 1);
            standing.setPoints(standing.getPoints() - 3);
        } else if (goalsFor == goalsAgainst) {
            standing.setDrawn(standing.getDrawn() - 1);
            standing.setPoints(standing.getPoints() - 1);
        } else {
            standing.setLost(standing.getLost() - 1);
        }
    }

    // Limpia las estadísticas acumuladas para recalcular standings desde cero
    private void resetStandingsForTournament(Tournament tournament) {
        List<Standing> standings = standingRepository
                .findByTournamentOrderByPointsDescGoalDifferenceDescGoalsForDesc(tournament);

        if (standings.isEmpty()) {
            return;
        }

        for (Standing standing : standings) {
            standing.setPlayed(0);
            standing.setWon(0);
            standing.setDrawn(0);
            standing.setLost(0);
            standing.setGoalsFor(0);
            standing.setGoalsAgainst(0);
            standing.setPoints(0);
        }

        standingRepository.saveAll(standings);
    }

    private MatchDto matchToDto(Match match) {
        MatchDto dto = new MatchDto();
        dto.setId(match.getId());
        dto.setHomeTeamName(match.getHomeTeam().getName());
        dto.setHomeTeamId(match.getHomeTeam().getId());
        dto.setAwayTeamName(match.getAwayTeam().getName());
        dto.setAwayTeamId(match.getAwayTeam().getId());
        dto.setHomeScore(match.getHomeScore());
        dto.setAwayScore(match.getAwayScore());
        dto.setMatchDate(match.getMatchDate());
        dto.setStatus(match.getStatus());
        return dto;
    }

    // --- Estadísticas para gráficas ---

    @Transactional(readOnly = true)
    public java.util.List<mx.edu.utez.ligamerbackend.dtos.PieDataDto> getPieStats(Long teamId) {
        System.out.println("[TournamentService] getPieStats - entrada. TeamId: " + teamId);
        Integer totalWins;
        Integer totalLosses;

        if (teamId != null) {
            totalWins = standingRepository.sumWonByTeamId(teamId);
            totalLosses = standingRepository.sumLostByTeamId(teamId);
        } else {
            totalWins = standingRepository.sumAllWon();
            totalLosses = standingRepository.sumAllLost();
        }

        totalWins = totalWins != null ? totalWins : 0;
        totalLosses = totalLosses != null ? totalLosses : 0;

        System.out.println(
                "[TournamentService] getPieStats - totals computed: wins=" + totalWins + ", losses=" + totalLosses);
        java.util.List<mx.edu.utez.ligamerbackend.dtos.PieDataDto> res = new java.util.ArrayList<>();
        mx.edu.utez.ligamerbackend.dtos.PieDataDto losses = new mx.edu.utez.ligamerbackend.dtos.PieDataDto();
        losses.setId(1L);
        losses.setValue(totalLosses);
        losses.setLabel("Derrotas");
        losses.setColor("#7e1010ff");
        mx.edu.utez.ligamerbackend.dtos.PieDataDto wins = new mx.edu.utez.ligamerbackend.dtos.PieDataDto();
        wins.setId(2L);
        wins.setValue(totalWins);
        wins.setLabel("Victorias");
        wins.setColor("#0f690fff");
        res.add(losses);
        res.add(wins);
        System.out.println("[TournamentService] getPieStats - salida");
        return res;
    }

    @Transactional(readOnly = true)
    public mx.edu.utez.ligamerbackend.dtos.RadarResponseDto getRadarStats(Long teamId, Long tournamentId) {
        // Nueva lógica: victorias/derrotas por miembro usando campos User.wins/losses
        // Sólo para el equipo solicitado (ignora otras escuadras)
        if (teamId == null) {
            throw new RuntimeException("El teamId es obligatorio para estadísticas de radar.");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));

        java.util.Map<Long, mx.edu.utez.ligamerbackend.dtos.PlayerStatDto> playerMap = new java.util.HashMap<>();

        // Incluir owner
        if (team.getOwner() != null) {
            addUserToPlayerMap(playerMap, team.getOwner());
        }

        // Incluir miembros
        if (team.getMembers() != null) {
            for (User member : team.getMembers()) {
                addUserToPlayerMap(playerMap, member);
            }
        }

        // Calcular totales
        int totalWins = playerMap.values().stream().mapToInt(p -> p.getVictorias() != null ? p.getVictorias() : 0)
                .sum();
        int totalLosses = playerMap.values().stream().mapToInt(p -> p.getDerrotas() != null ? p.getDerrotas() : 0)
                .sum();

        mx.edu.utez.ligamerbackend.dtos.RadarResponseDto resp = new mx.edu.utez.ligamerbackend.dtos.RadarResponseDto();
        resp.setPlayers(new java.util.ArrayList<>(playerMap.values()));
        resp.setVictoriasTotales(totalWins);
        resp.setDerrotasTotales(totalLosses);
        return resp;
    }

    private void addUserToPlayerMap(java.util.Map<Long, mx.edu.utez.ligamerbackend.dtos.PlayerStatDto> map, User user) {
        if (user == null || user.getId() == null)
            return;

        PlayerStatDto dto = map.get(user.getId());
        if (dto == null) {
            dto = new PlayerStatDto();
            dto.setId(user.getId());
            String fullName = user.getNombre();
            if (fullName != null && user.getApellidoPaterno() != null) {
                fullName += " " + user.getApellidoPaterno();
            }
            if (fullName != null && user.getApellidoMaterno() != null) {
                fullName += " " + user.getApellidoMaterno();
            }
            String displayName = (fullName != null && !fullName.trim().isEmpty()) ? fullName : user.getEmail();
            dto.setNombre(displayName);
            dto.setVictorias(0);
            dto.setDerrotas(0);
            map.put(user.getId(), dto);
        }

        int wins = user.getWins() != null ? user.getWins() : 0;
        int losses = user.getLosses() != null ? user.getLosses() : 0;
        dto.setVictorias(wins);
        dto.setDerrotas(losses);
    }

    @Transactional(readOnly = true)
    public java.util.List<mx.edu.utez.ligamerbackend.dtos.TournamentSeriesDto> getTournamentSeries(Long teamId) {
        if (teamId == null) {
            throw new RuntimeException("El teamId es obligatorio para series por equipo.");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));

        java.util.List<mx.edu.utez.ligamerbackend.dtos.TournamentSeriesDto> res = new java.util.ArrayList<>();

        for (Tournament t : team.getTournaments()) {
            int encuentros = 0;
            int ganados = 0;
            int perdidos = 0;
            java.util.List<Match> matches = matchRepository.findByTournamentOrderByMatchDateAsc(t);

            for (Match m : matches) {
                if (m.getHomeScore() == null || m.getAwayScore() == null) {
                    continue; // solo partidos con resultado
                }

                boolean isHome = m.getHomeTeam() != null && m.getHomeTeam().getId().equals(teamId);
                boolean isAway = m.getAwayTeam() != null && m.getAwayTeam().getId().equals(teamId);
                if (!isHome && !isAway) {
                    continue; // ignorar partidos donde el equipo no jugó
                }

                encuentros++;
                if (isHome) {
                    if (m.getHomeScore() > m.getAwayScore())
                        ganados++;
                    else if (m.getHomeScore() < m.getAwayScore())
                        perdidos++;
                } else { // isAway
                    if (m.getAwayScore() > m.getHomeScore())
                        ganados++;
                    else if (m.getAwayScore() < m.getHomeScore())
                        perdidos++;
                }
            }

            // Solo agregar torneos donde el equipo tuvo al menos un encuentro con resultado
            if (encuentros > 0) {
                mx.edu.utez.ligamerbackend.dtos.TournamentSeriesDto dto = new mx.edu.utez.ligamerbackend.dtos.TournamentSeriesDto();
                dto.setId(t.getId());
                dto.setTorneo(t.getName());
                dto.setEncuentros(encuentros);
                dto.setGanados(ganados);
                dto.setPerdidos(perdidos);
                res.add(dto);
            }
        }

        return res;
    }

    @Autowired
    private mx.edu.utez.ligamerbackend.repositories.TournamentJoinRequestRepository tournamentJoinRequestRepository;

    public void createJoinRequest(Long tournamentId, Long teamId, String requesterEmail) throws Exception {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Torneo no encontrado."));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // Validar que el solicitante sea el dueño del equipo
        if (!team.getOwner().getId().equals(requester.getId())) {
            throw new RuntimeException("Solo el dueño del equipo puede solicitar unirse.");
        }

        // Validar si ya está inscrito
        if (tournament.getTeams().contains(team)) {
            throw new RuntimeException("El equipo ya está inscrito en el torneo.");
        }

        // Validar si ya existe una solicitud pendiente
        if (tournamentJoinRequestRepository.findByTournamentIdAndTeamId(tournamentId, teamId).isPresent()) {
            throw new RuntimeException(
                    "Ya existe una solicitud pendiente o procesada para este equipo en este torneo.");
        }

        mx.edu.utez.ligamerbackend.models.TournamentJoinRequest request = new mx.edu.utez.ligamerbackend.models.TournamentJoinRequest();
        request.setTournament(tournament);
        request.setTeam(team);
        request.setStatus("PENDING");
        tournamentJoinRequestRepository.save(request);
    }

    public List<Map<String, Object>> getJoinRequests(Long tournamentId, String requesterEmail) throws Exception {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // Validar que sea organizador o admin
        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean isOrganizerOrAdmin = AppConstants.ROLE_ORGANIZADOR.equals(roleName) ||
                AppConstants.ROLE_ADMINISTRADOR.equals(roleName);

        // Opcional: Validar que sea el creador del torneo si es organizador
        if (!isOrganizerOrAdmin) {
            throw new RuntimeException("No autorizado.");
        }

        List<mx.edu.utez.ligamerbackend.models.TournamentJoinRequest> requests = tournamentJoinRequestRepository
                .findByTournamentId(tournamentId);

        return requests.stream().map(r -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            map.put("teamId", r.getTeam().getId());
            map.put("teamName", r.getTeam().getName());
            map.put("teamLogo", r.getTeam().getLogoUrl());
            map.put("status", r.getStatus());
            map.put("requestDate", r.getRequestDate());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllPendingJoinRequests(String requesterEmail) throws Exception {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean isOrganizerOrAdmin = AppConstants.ROLE_ORGANIZADOR.equals(roleName) ||
                AppConstants.ROLE_ADMINISTRADOR.equals(roleName);
        if (!isOrganizerOrAdmin) {
            throw new RuntimeException("No autorizado. Rol inválido.");
        }

        List<mx.edu.utez.ligamerbackend.models.TournamentJoinRequest> requests = tournamentJoinRequestRepository
                .findByTournament_CreatedBy_EmailAndStatus(requesterEmail, "PENDING");

        return requests.stream().map(r -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            map.put("teamId", r.getTeam().getId());
            map.put("teamName", r.getTeam().getName());
            map.put("teamLogo", r.getTeam().getLogoUrl());
            map.put("status", r.getStatus());
            map.put("requestDate", r.getRequestDate());
            // Add tournament info since we are returning requests from multiple tournaments
            map.put("tournamentId", r.getTournament().getId());
            map.put("tournamentName", r.getTournament().getName());
            return map;
        }).collect(Collectors.toList());
    }

    public void respondToJoinRequest(Long requestId, String status, String requesterEmail) throws Exception {
        mx.edu.utez.ligamerbackend.models.TournamentJoinRequest request = tournamentJoinRequestRepository
                .findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada."));

        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        // Validar permisos (Organizador/Admin)
        String roleName = requester.getRole() != null ? requester.getRole().getName() : null;
        boolean isOrganizerOrAdmin = AppConstants.ROLE_ORGANIZADOR.equals(roleName) ||
                AppConstants.ROLE_ADMINISTRADOR.equals(roleName);
        if (!isOrganizerOrAdmin) {
            throw new RuntimeException("No autorizado.");
        }

        if ("ACCEPTED".equalsIgnoreCase(status)) {
            Tournament tournament = request.getTournament();
            Team team = request.getTeam();

            // 1. Validar límite de equipos del torneo
            if (tournament.getNumTeams() != null && tournament.getTeams().size() >= tournament.getNumTeams()) {
                throw new RuntimeException(
                        "No se puede aceptar la solicitud: El torneo ha alcanzado el límite de equipos.");
            }

            // 2. Validar disponibilidad de huecos en los partidos (si ya existen partidos)
            List<Match> matches = matchRepository.findByTournamentOrderByMatchDateAsc(tournament);
            if (!matches.isEmpty()) {
                boolean hasSlot = matches.stream().anyMatch(m -> m.getHomeTeam() == null || m.getAwayTeam() == null);
                if (!hasSlot) {
                    throw new RuntimeException(
                            "No se puede aceptar la solicitud: Ya no hay cupos disponibles en el calendario de partidos.");
                }
            }

            request.setStatus("ACCEPTED");

            if (!tournament.getTeams().contains(team)) {
                tournament.getTeams().add(team);
                team.getTournaments().add(tournament);
                tournamentRepository.save(tournament);

                // --- Lógica de Asignación a Match (Slot Filling) ---
                // Buscamos el primer partido con hueco y asignamos
                for (Match m : matches) {
                    if (m.getHomeTeam() == null) {
                        m.setHomeTeam(team);
                        matchRepository.save(m);
                        break; // Asignado a un slot, terminamos
                    } else if (m.getAwayTeam() == null) {
                        m.setAwayTeam(team);
                        matchRepository.save(m);
                        break; // Asignado a un slot, terminamos
                    }
                }
            }
        } else {
            request.setStatus("REJECTED");
        }
        tournamentJoinRequestRepository.save(request);
    }
}
