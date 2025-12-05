package mx.edu.utez.ligamerbackend.controllers;

import mx.edu.utez.ligamerbackend.dtos.ApiResponseDto;
import mx.edu.utez.ligamerbackend.dtos.ChallengeDto;
import mx.edu.utez.ligamerbackend.dtos.MatchDto;
import mx.edu.utez.ligamerbackend.services.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/matches")
public class MatchController {

    @Autowired
    private MatchService matchService;

    @PostMapping("/challenge")
    public ResponseEntity<ApiResponseDto<MatchDto>> challengeTeam(@RequestBody ChallengeDto dto) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            MatchDto match = matchService.createChallenge(dto, email);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDto.success("Reto creado exitosamente", match));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDto.error("Error al crear el reto: " + e.getMessage()));
        }
    }

    @PostMapping("/friendly/invite")
    public ResponseEntity<ApiResponseDto<MatchDto>> inviteFriendly(
            @RequestBody mx.edu.utez.ligamerbackend.dtos.FriendlyChallengeDto dto) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            MatchDto match = matchService.createFriendlyChallenge(dto, email);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponseDto.success("Invitación a amistoso enviada", match));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDto.error("Error al enviar invitación: " + e.getMessage()));
        }
    }

    @PutMapping("/friendly/{matchId}/respond")
    public ResponseEntity<ApiResponseDto<MatchDto>> respondFriendly(
            @PathVariable Long matchId,
            @RequestParam String action) { // ACCEPT or REJECT
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = auth.getName();
            MatchDto match = matchService.respondToFriendlyChallenge(matchId, action, email);
            return ResponseEntity.ok(ApiResponseDto.success("Respuesta procesada", match));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponseDto.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDto.error("Error al procesar respuesta: " + e.getMessage()));
        }
    }

    @GetMapping("/friendly/pending/{teamId}")
    public ResponseEntity<ApiResponseDto<java.util.List<MatchDto>>> getPendingFriendly(@PathVariable Long teamId) {
        try {
            java.util.List<MatchDto> matches = matchService.getPendingFriendlyChallenges(teamId);
            return ResponseEntity.ok(ApiResponseDto.success("Invitaciones pendientes obtenidas", matches));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponseDto.error("Error al obtener invitaciones: " + e.getMessage()));
        }
    }
}
