package mx.edu.utez.ligamerbackend.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class UserLeftTeamEvent extends ApplicationEvent {
    private final Long teamId;
    private final String teamName;
    private final String userEmail;

    public UserLeftTeamEvent(Object source, Long teamId, String teamName, String userEmail) {
        super(source);
        this.teamId = teamId;
        this.teamName = teamName;
        this.userEmail = userEmail;
    }
}

