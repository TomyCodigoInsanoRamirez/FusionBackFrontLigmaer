package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class JoinRequestCreatedEvent extends ApplicationEvent {
    private final Long requestId;
    private final Long teamId;
    private final String teamName;
    private final String userEmail;

    public JoinRequestCreatedEvent(Object source, Long requestId, Long teamId, String teamName, String userEmail) {
        super(source);
        this.requestId = requestId;
        this.teamId = teamId;
        this.teamName = teamName;
        this.userEmail = userEmail;
    }
}

