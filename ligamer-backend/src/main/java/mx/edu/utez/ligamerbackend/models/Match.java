package mx.edu.utez.ligamerbackend.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@NoArgsConstructor
@Getter
@Setter
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = true)
    private Tournament tournament;

    @ManyToOne
    @JoinColumn(name = "home_team_id", nullable = true)
    private Team homeTeam;

    @ManyToOne
    @JoinColumn(name = "away_team_id", nullable = true)
    private Team awayTeam;

    @Column(nullable = false)
    private Integer homeScore = 0;

    @Column(nullable = false)
    private Integer awayScore = 0;

    @Column(nullable = false)
    private LocalDateTime matchDate;

    @Column(length = 20, nullable = false)
    private String status; // PENDING, IN_PROGRESS, FINISHED, CANCELLED

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "node_id")
    private String nodeId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = "PENDING";
        }
    }
}
