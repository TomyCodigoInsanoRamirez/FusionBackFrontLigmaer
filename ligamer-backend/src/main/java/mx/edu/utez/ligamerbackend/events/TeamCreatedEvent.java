package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TeamCreatedEvent extends ApplicationEvent {
    private final Long teamId;
    private final String teamName;
    private final String ownerEmail;

    public TeamCreatedEvent(Object source, Long teamId, String teamName, String ownerEmail) {
        super(source);
        this.teamId = teamId;
        this.teamName = teamName;
        this.ownerEmail = ownerEmail;
    }
}

