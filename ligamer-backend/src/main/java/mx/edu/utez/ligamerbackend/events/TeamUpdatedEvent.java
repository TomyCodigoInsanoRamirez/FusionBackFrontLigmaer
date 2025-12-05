package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TeamUpdatedEvent extends ApplicationEvent {
    private final Long teamId;
    private final String teamName;
    private final String updatedBy;

    public TeamUpdatedEvent(Object source, Long teamId, String teamName, String updatedBy) {
        super(source);
        this.teamId = teamId;
        this.teamName = teamName;
        this.updatedBy = updatedBy;
    }
}

