package mx.edu.utez.ligamerbackend.controllers;

import mx.edu.utez.ligamerbackend.dtos.PieDataDto;
import mx.edu.utez.ligamerbackend.dtos.RadarResponseDto;
import mx.edu.utez.ligamerbackend.dtos.TournamentSeriesDto;
import mx.edu.utez.ligamerbackend.dtos.ApiResponseDto;
import mx.edu.utez.ligamerbackend.dtos.StatsRequestDto;
import mx.edu.utez.ligamerbackend.services.TournamentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private TournamentService tournamentService;

    @PostMapping("/pie")
    public ResponseEntity<ApiResponseDto<List<PieDataDto>>> getPie(@RequestBody StatsRequestDto dto) {
        System.out.println("[StatsController] POST /api/stats/pie - entrada");
        try {
            List<PieDataDto> data = tournamentService.getPieStats(dto.getTeamId());
            System.out.println(
                    "[StatsController] POST /api/stats/pie - datos obtenidos, size="
                            + (data != null ? data.size() : 0));
            return ResponseEntity.ok(ApiResponseDto.success("Datos pie obtenidos", data));
        } catch (Exception e) {
            System.out.println("[StatsController] POST /api/stats/pie - excepción: " + e.getMessage());
            return ResponseEntity.internalServerError().body(ApiResponseDto.error("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/radar")
    public ResponseEntity<ApiResponseDto<RadarResponseDto>> getRadar(@RequestBody StatsRequestDto dto) {
        try {
            RadarResponseDto response = tournamentService.getRadarStats(dto.getTeamId(), dto.getTournamentId());
            return ResponseEntity.ok(ApiResponseDto.success("Datos radar obtenidos", response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponseDto.badRequest(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDto.error("Error: " + e.getMessage()));
        }
    }

    @PostMapping("/series")
    public ResponseEntity<ApiResponseDto<List<TournamentSeriesDto>>> getSeries(@RequestBody StatsRequestDto dto) {
        try {
            List<TournamentSeriesDto> list = tournamentService.getTournamentSeries(dto.getTeamId());
            return ResponseEntity.ok(ApiResponseDto.success("Series obtenidas", list));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponseDto.error("Error: " + e.getMessage()));
        }
    }
}
