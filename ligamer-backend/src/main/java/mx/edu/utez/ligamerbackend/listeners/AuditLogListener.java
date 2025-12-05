package mx.edu.utez.ligamerbackend.listeners;

import mx.edu.utez.ligamerbackend.events.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class AuditLogListener {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogListener.class);

    @Async
    @EventListener
    public void handleUserRegistered(UserRegisteredEvent event) {
        logger.info("🔍 AUDIT: Usuario registrado - Email: {}, UserId: {}, Rol: {}",
            event.getEmail(), event.getUserId(), event.getRoleName());
    }

    @Async
    @EventListener
    public void handlePasswordResetRequested(PasswordResetRequestedEvent event) {
        logger.info("🔍 AUDIT: Solicitud de recuperación de contraseña - Email: {}", event.getEmail());
    }

    @Async
    @EventListener
    public void handlePasswordResetCompleted(PasswordResetCompletedEvent event) {
        logger.info("🔍 AUDIT: Contraseña restablecida - Email: {}, UserId: {}",
            event.getEmail(), event.getUserId());
    }

    @Async
    @EventListener
    public void handleUserProfileUpdated(UserProfileUpdatedEvent event) {
        logger.info("🔍 AUDIT: Perfil actualizado - UserId: {}, Email Anterior: {}, Email Nuevo: {}, Password Cambiado: {}",
            event.getUserId(), event.getOldEmail(), event.getNewEmail(), event.isPasswordChanged());
    }

    @Async
    @EventListener
    public void handleTeamCreated(TeamCreatedEvent event) {
        logger.info("🔍 AUDIT: Equipo creado - TeamId: {}, Nombre: {}, Creador: {}",
            event.getTeamId(), event.getTeamName(), event.getOwnerEmail());
    }

    @Async
    @EventListener
    public void handleTeamUpdated(TeamUpdatedEvent event) {
        logger.info("🔍 AUDIT: Equipo actualizado - TeamId: {}, Nombre: {}, Actualizado por: {}",
            event.getTeamId(), event.getTeamName(), event.getUpdatedBy());
    }

    @Async
    @EventListener
    public void handleTeamDeleted(TeamDeletedEvent event) {
        logger.info("🔍 AUDIT: Equipo eliminado - TeamId: {}, Nombre: {}, Eliminado por: {}",
            event.getTeamId(), event.getTeamName(), event.getDeletedBy());
    }

    @Async
    @EventListener
    public void handleJoinRequestCreated(JoinRequestCreatedEvent event) {
        logger.info("🔍 AUDIT: Solicitud de unión creada - RequestId: {}, TeamId: {}, Team: {}, Usuario: {}",
            event.getRequestId(), event.getTeamId(), event.getTeamName(), event.getUserEmail());
    }

    @Async
    @EventListener
    public void handleJoinRequestAccepted(JoinRequestAcceptedEvent event) {
        logger.info("🔍 AUDIT: Solicitud de unión aceptada - RequestId: {}, TeamId: {}, Team: {}, Usuario: {}, Aceptado por: {}",
            event.getRequestId(), event.getTeamId(), event.getTeamName(), event.getUserEmail(), event.getAcceptedBy());
    }

    @Async
    @EventListener
    public void handleJoinRequestRejected(JoinRequestRejectedEvent event) {
        logger.info("🔍 AUDIT: Solicitud de unión rechazada - RequestId: {}, TeamId: {}, Team: {}, Usuario: {}, Rechazado por: {}",
            event.getRequestId(), event.getTeamId(), event.getTeamName(), event.getUserEmail(), event.getRejectedBy());
    }

    @Async
    @EventListener
    public void handleUserLeftTeam(UserLeftTeamEvent event) {
        logger.info("🔍 AUDIT: Usuario abandonó equipo - TeamId: {}, Team: {}, Usuario: {}",
            event.getTeamId(), event.getTeamName(), event.getUserEmail());
    }
}

