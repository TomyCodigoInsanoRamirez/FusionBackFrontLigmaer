package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PasswordResetRequestedEvent extends ApplicationEvent {
    private final String email;
    private final String token;

    public PasswordResetRequestedEvent(Object source, String email, String token) {
        super(source);
        this.email = email;
        this.token = token;
    }
}

