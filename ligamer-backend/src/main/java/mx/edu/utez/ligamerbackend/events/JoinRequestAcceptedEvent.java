package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class JoinRequestAcceptedEvent extends ApplicationEvent {
    private final Long requestId;
    private final Long teamId;
    private final String teamName;
    private final String userEmail;
    private final String acceptedBy;

    public JoinRequestAcceptedEvent(Object source, Long requestId, Long teamId, String teamName, String userEmail, String acceptedBy) {
        super(source);
        this.requestId = requestId;
        this.teamId = teamId;
        this.teamName = teamName;
        this.userEmail = userEmail;
        this.acceptedBy = acceptedBy;
    }
}

