package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class TournamentFullDto {
    private Long id;
    private String tournamentName;
    private String description;
    private Integer numTeams;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationCloseDate;
    private List<String> ruleList;
    private Map<String, String> matchDates;
    private String estado;
    private LocalDateTime generadoEl;
    private LocalDateTime actualizadoEl;
    private List<TeamSimpleDto> teams;
    private Map<String, MatchSimpleDto> matches;
}

