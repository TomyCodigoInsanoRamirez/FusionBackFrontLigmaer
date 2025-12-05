package mx.edu.utez.ligamerbackend.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "standings", uniqueConstraints = @UniqueConstraint(columnNames = {"tournament_id", "team_id"}))
@NoArgsConstructor
@Getter
@Setter
public class Standing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(nullable = false)
    private Integer played = 0;

    @Column(nullable = false)
    private Integer won = 0;

    @Column(nullable = false)
    private Integer drawn = 0;

    @Column(nullable = false)
    private Integer lost = 0;

    @Column(nullable = false)
    private Integer goalsFor = 0;

    @Column(nullable = false)
    private Integer goalsAgainst = 0;

    @Column(nullable = false)
    private Integer points = 0;

    /**
     * Calcula los puntos: 3 por victoria, 1 por empate
     */
    public void updatePoints() {
        this.points = (this.won * 3) + (this.drawn * 1);
    }

    /**
     * Actualiza las estadísticas basadas en el resultado de un partido
     * homeTeamWon: true si el equipo local ganó, false si perdió o empataron
     * isHomeTeam: true si este equipo era local, false si era visitante
     */
    public void updateFromMatch(Integer homeScore, Integer awayScore, boolean isHomeTeam) {
        this.played++;

        if (isHomeTeam) {
            this.goalsFor += homeScore;
            this.goalsAgainst += awayScore;

            if (homeScore > awayScore) {
                this.won++;
            } else if (homeScore < awayScore) {
                this.lost++;
            } else {
                this.drawn++;
            }
        } else {
            this.goalsFor += awayScore;
            this.goalsAgainst += homeScore;

            if (awayScore > homeScore) {
                this.won++;
            } else if (awayScore < homeScore) {
                this.lost++;
            } else {
                this.drawn++;
            }
        }

        this.updatePoints();
    }
}
