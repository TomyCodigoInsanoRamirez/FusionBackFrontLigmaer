package mx.edu.utez.ligamerbackend.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import mx.edu.utez.ligamerbackend.utils.JsonConverters;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "tournaments")
@NoArgsConstructor
@Getter
@Setter
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String rules;

    private LocalDate startDate;

    private LocalDate endDate;

    // --- Nuevos campos ---
    private Integer numTeams;

    private LocalDate registrationCloseDate;

    @Convert(converter = JsonConverters.StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> ruleList;

    @Convert(converter = JsonConverters.StringMapConverter.class)
    @Column(columnDefinition = "TEXT")
    private Map<String, String> matchDates;

    @Column(length = 50)
    private String estado;

    private LocalDateTime generadoEl;

    private LocalDateTime actualizadoEl;

    @Column(columnDefinition = "BOOL DEFAULT TRUE")
    private boolean active = true;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "tournament_teams",
            joinColumns = @JoinColumn(name = "tournament_id"),
            inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    private Set<Team> teams = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        // Inicializar timestamps y estado
        if (this.generadoEl == null) {
            this.generadoEl = java.time.LocalDateTime.now();
        }
        if (this.estado == null) {
            this.estado = "Guardado";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.actualizadoEl = java.time.LocalDateTime.now();
    }
}
