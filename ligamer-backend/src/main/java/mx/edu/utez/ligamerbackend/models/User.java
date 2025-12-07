package mx.edu.utez.ligamerbackend.models;

import com.fasterxml.jackson.annotation.JsonGetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

@Entity
@Table(name = "users")
@NoArgsConstructor
@Getter
@Setter
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = true)
    private String nombre;

    @Column(name = "apellido_paterno", length = 100, nullable = true)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", length = 100)
    private String apellidoMaterno;

    @Column(length = 50, unique = true)
    private String username;

    @Column(length = 150, nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(columnDefinition = "BOOL DEFAULT TRUE")
    private boolean active;

    @ManyToOne(optional = false)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expiry")
    private LocalDateTime resetPasswordTokenExpiry;

    @Column(name = "wins", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer wins = 0;

    @Column(name = "losses", nullable = false, columnDefinition = "INT DEFAULT 0")
    private Integer losses = 0;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        System.out.println("🔍 DEBUG getAuthorities() - Email: " + this.email + ", Role: "
                + (this.role != null ? this.role.getName() : "NULL"));
        if (this.role == null || this.role.getName() == null) {
            System.out.println("⚠️ Role is NULL for user: " + this.email);
            return Collections.emptyList();
        }
        System.out.println("✅ Returning authority: " + this.role.getName());
        return Collections.singletonList(new SimpleGrantedAuthority(this.role.getName()));
    }

    @Override
    @JsonIgnore // se usa para autenticación (correo), pero no para serializar al frontend
    public String getUsername() {
        return this.email;
    }

    // Exponer el username real en las respuestas JSON sin tocar getUsername() de UserDetails
    @JsonGetter("username")
    public String getVisibleUsername() {
        return this.username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return this.active;
    }
}