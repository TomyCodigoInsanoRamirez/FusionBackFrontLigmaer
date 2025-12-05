package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class PasswordResetCompletedEvent extends ApplicationEvent {
    private final String email;
    private final Long userId;

    public PasswordResetCompletedEvent(Object source, String email, Long userId) {
        super(source);
        this.email = email;
        this.userId = userId;
    }
}

