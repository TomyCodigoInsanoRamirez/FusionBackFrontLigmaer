package mx.edu.utez.ligamerbackend.services;

import mx.edu.utez.ligamerbackend.dtos.TeamDto;
import mx.edu.utez.ligamerbackend.events.*;
import mx.edu.utez.ligamerbackend.models.*;
import mx.edu.utez.ligamerbackend.repositories.JoinRequestRepository;
import mx.edu.utez.ligamerbackend.repositories.TeamRepository;
import mx.edu.utez.ligamerbackend.repositories.UserRepository;
import mx.edu.utez.ligamerbackend.utils.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JoinRequestRepository joinRequestRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    public Team createTeam(String ownerEmail, TeamDto teamDto) throws Exception {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (teamRepository.existsByOwner(owner)) {
            throw new Exception("El usuario ya posee un equipo.");
        }

        if (teamRepository.findByMembersContaining(owner).isPresent()) {
            throw new Exception("El usuario ya es miembro de otro equipo.");
        }

        if (teamRepository.findByName(teamDto.getName()).isPresent()) {
            throw new Exception("Ya existe un equipo con ese nombre.");
        }

        Team team = new Team();
        team.setName(teamDto.getName());
        team.setDescription(teamDto.getDescription());
        team.setLogoUrl(teamDto.getLogoUrl());
        team.setOwner(owner);
        Set<User> members = new HashSet<>();
        members.add(owner);
        team.setMembers(members);

        Team savedTeam = teamRepository.save(team);

        // Publicar evento de equipo creado
        eventPublisher.publishEvent(new TeamCreatedEvent(this,
                savedTeam.getId(),
                savedTeam.getName(),
                owner.getEmail()));

        return savedTeam;
    }

    @Transactional(readOnly = true)
    public List<Team> listTeams() {
        return teamRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Team getTeam(Long teamId) {
        return teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado."));
    }

    public Team updateTeam(Long teamId, String requesterEmail, TeamDto dto) throws Exception {
        Team team = getTeam(teamId);
        if (!team.getOwner().getEmail().equalsIgnoreCase(requesterEmail))
            throw new Exception("No autorizado.");

        if (dto.getName() != null && !dto.getName().equals(team.getName())) {
            if (teamRepository.findByName(dto.getName()).isPresent())
                throw new Exception("Nombre de equipo en uso.");
            team.setName(dto.getName());
        }
        if (dto.getDescription() != null)
            team.setDescription(dto.getDescription());
        if (dto.getLogoUrl() != null)
            team.setLogoUrl(dto.getLogoUrl());

        Team updatedTeam = teamRepository.save(team);

        // Publicar evento de equipo actualizado
        eventPublisher.publishEvent(new TeamUpdatedEvent(this,
                updatedTeam.getId(),
                updatedTeam.getName(),
                requesterEmail));

        return updatedTeam;
    }

    public void deleteTeam(Long teamId, String requesterEmail) throws Exception {
        Team team = getTeam(teamId);
        if (!team.getOwner().getEmail().equalsIgnoreCase(requesterEmail))
            throw new Exception("No autorizado.");

        String teamName = team.getName();
        teamRepository.delete(team);

        // Publicar evento de equipo eliminado
        eventPublisher.publishEvent(new TeamDeletedEvent(this, teamId, teamName, requesterEmail));
    }

    public JoinRequest createJoinRequest(Long teamId, String requesterEmail) throws Exception {
        Team team = getTeam(teamId);
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (team.getMembers() != null && team.getMembers().contains(user))
            throw new Exception("Ya eres miembro de este equipo.");

        if (teamRepository.findByMembersContaining(user).isPresent())
            throw new Exception("Ya perteneces a otro equipo.");

        Optional<JoinRequest> existing = joinRequestRepository.findByTeamAndUser(team, user);
        if (existing.isPresent() && AppConstants.JOIN_REQUEST_PENDING.equals(existing.get().getStatus()))
            throw new Exception("Ya existe una solicitud pendiente.");

        JoinRequest jr = new JoinRequest();
        jr.setTeam(team);
        jr.setUser(user);
        jr.setStatus(AppConstants.JOIN_REQUEST_PENDING);

        JoinRequest savedRequest = joinRequestRepository.save(jr);

        // Publicar evento de solicitud creada
        eventPublisher.publishEvent(new JoinRequestCreatedEvent(this,
                savedRequest.getId(),
                team.getId(),
                team.getName(),
                user.getEmail()));

        return savedRequest;
    }

    @Transactional(readOnly = true)
    public List<JoinRequest> getJoinRequests(Long teamId, String requesterEmail) throws Exception {
        Team team = getTeam(teamId);
        if (!team.getOwner().getEmail().equalsIgnoreCase(requesterEmail))
            throw new Exception("No autorizado.");

        // Incluir solicitudes pendientes y avisos informativos de abandono
        List<JoinRequest> all = joinRequestRepository.findAllByTeam(team);
        List<String> allowed = Arrays.asList(AppConstants.JOIN_REQUEST_PENDING, AppConstants.JOIN_REQUEST_LEFT_INFO);
        List<JoinRequest> filtered = new ArrayList<>();
        for (JoinRequest jr : all) {
            if (allowed.contains(jr.getStatus())) {
                filtered.add(jr);
            }
        }
        return filtered;
    }

    public JoinRequest manageJoinRequest(Long teamId, Long requestId, String action, String requesterEmail)
            throws Exception {
        Team team = getTeam(teamId);
        if (!team.getOwner().getEmail().equalsIgnoreCase(requesterEmail))
            throw new Exception("No autorizado.");

        JoinRequest jr = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada."));

        if (!jr.getTeam().getId().equals(team.getId()))
            throw new Exception("Solicitud no pertenece a este equipo.");
        
                if (!AppConstants.JOIN_REQUEST_PENDING.equalsIgnoreCase(jr.getStatus()))
                    throw new Exception("Esta solicitud es informativa y no requiere acción.");

        if ("accept".equalsIgnoreCase(action)) {
            User user = jr.getUser();
            if (teamRepository.findByMembersContaining(user).isPresent())
                throw new Exception("El usuario ya pertenece a un equipo.");
            Set<User> members = team.getMembers();
            if (members == null)
                members = new HashSet<>();
            members.add(user);
            team.setMembers(members);
            jr.setStatus(AppConstants.JOIN_REQUEST_ACCEPTED);
            teamRepository.save(team);
            JoinRequest savedRequest = joinRequestRepository.save(jr);

            // Publicar evento de solicitud aceptada
            eventPublisher.publishEvent(new JoinRequestAcceptedEvent(this,
                    savedRequest.getId(),
                    team.getId(),
                    team.getName(),
                    user.getEmail(),
                    requesterEmail));

            return savedRequest;
        } else if ("reject".equalsIgnoreCase(action)) {
            jr.setStatus(AppConstants.JOIN_REQUEST_REJECTED);
            JoinRequest savedRequest = joinRequestRepository.save(jr);

            // Publicar evento de solicitud rechazada
            eventPublisher.publishEvent(new JoinRequestRejectedEvent(this,
                    savedRequest.getId(),
                    team.getId(),
                    team.getName(),
                    jr.getUser().getEmail(),
                    requesterEmail));

            return savedRequest;
        } else {
            throw new Exception("Acción inválida.");
        }
    }

    public void leaveTeam(Long teamId, String requesterEmail) throws Exception {
        Team team = getTeam(teamId);
        User user = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado."));

        if (team.getOwner().getId().equals(user.getId()))
            throw new Exception("El dueño no puede abandonar el equipo.");

        // Bloquear salida si el equipo participa en un torneo en curso
        boolean hasOngoingTournament = team.getTournaments() != null && team.getTournaments()
                .stream()
                .anyMatch(t -> "En curso".equalsIgnoreCase(t.getEstado()));
        if (hasOngoingTournament) {
            throw new Exception("No puedes abandonar el equipo mientras participas en un torneo");
        }

        Set<User> members = team.getMembers();
        if (members == null || !members.removeIf(u -> u.getId().equals(user.getId())))
            throw new Exception("No eres miembro del equipo.");
        team.setMembers(members);
        teamRepository.save(team);

        // Crear notificación informativa para el dueño (se reutiliza join_requests como bandeja)
        JoinRequest info = new JoinRequest();
        info.setTeam(team);
        info.setUser(user);
        info.setStatus(AppConstants.JOIN_REQUEST_LEFT_INFO);
        joinRequestRepository.save(info);

        // Publicar evento de usuario abandonó equipo
        eventPublisher.publishEvent(new UserLeftTeamEvent(this,
                team.getId(),
                team.getName(),
                user.getEmail()));
    }

    public void removeMember(Long teamId, Long userId, String requesterEmail) throws Exception {
        Team team = getTeam(teamId);
        if (!team.getOwner().getEmail().equalsIgnoreCase(requesterEmail))
            throw new Exception("No autorizado.");
        if (team.getOwner().getId().equals(userId))
            throw new Exception("No puedes expulsar al dueño.");

        Set<User> members = team.getMembers();
        boolean removed = members != null && members.removeIf(u -> u.getId().equals(userId));
        if (!removed)
            throw new Exception("El usuario no es miembro del equipo.");

        team.setMembers(members);
        teamRepository.save(team);
    }
}
