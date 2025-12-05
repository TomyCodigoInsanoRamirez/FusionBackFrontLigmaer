package mx.edu.utez.ligamerbackend.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import mx.edu.utez.ligamerbackend.utils.AppConstants;

import java.time.LocalDateTime;

@Entity
@Table(name = "join_requests")
@NoArgsConstructor
@Getter
@Setter
public class JoinRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id")
    private Team team;

    private String status;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = AppConstants.JOIN_REQUEST_PENDING;
    }
}
