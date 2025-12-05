package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UserRegisteredEvent extends ApplicationEvent {
    private final String email;
    private final Long userId;
    private final String roleName;

    public UserRegisteredEvent(Object source, String email, Long userId, String roleName) {
        super(source);
        this.email = email;
        this.userId = userId;
        this.roleName = roleName;
    }
}

