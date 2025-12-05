package mx.edu.utez.ligamerbackend.dtos;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class TournamentDetailResponseDto {
    private Long id;
    private String name;
    private String description;
    private String rules;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean active;
    private String createdByEmail;

    // Nuevos campos
    private Integer numTeams;
    private LocalDate registrationCloseDate;
    private List<String> ruleList;
    private Map<String, String> matchDates;
    private String estado;
    private LocalDateTime generadoEl;
    private LocalDateTime actualizadoEl;
    private List<TeamSimpleDto> teams;
    private Map<String, MatchSimpleDto> matches;

    public TournamentDetailResponseDto() {
        this.teams = new ArrayList<>();
    }
}
