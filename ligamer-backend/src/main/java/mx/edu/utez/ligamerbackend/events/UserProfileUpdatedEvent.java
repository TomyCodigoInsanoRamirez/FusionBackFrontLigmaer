package mx.edu.utez.ligamerbackend.events;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;
@Getter
public class UserProfileUpdatedEvent extends ApplicationEvent {
    private final Long userId;
    private final String oldEmail;
    private final String newEmail;
    private final boolean passwordChanged;
    public UserProfileUpdatedEvent(Object source, Long userId, String oldEmail, String newEmail, boolean passwordChanged) {
        super(source);
        this.userId = userId;
        this.oldEmail = oldEmail;
        this.newEmail = newEmail;
        this.passwordChanged = passwordChanged;
    }
}
