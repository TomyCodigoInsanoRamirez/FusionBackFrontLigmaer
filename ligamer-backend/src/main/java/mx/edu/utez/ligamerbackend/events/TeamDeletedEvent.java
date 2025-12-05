package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class TeamDeletedEvent extends ApplicationEvent {
    private final Long teamId;
    private final String teamName;
    private final String deletedBy;

    public TeamDeletedEvent(Object source, Long teamId, String teamName, String deletedBy) {
        super(source);
        this.teamId = teamId;
        this.teamName = teamName;
        this.deletedBy = deletedBy;
    }
}

