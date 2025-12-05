package mx.edu.utez.ligamerbackend.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseDto<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;
    private LocalDateTime timestamp;

    // Constructor para éxito sin data
    public ApiResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    // Constructor para éxito con data
    public ApiResponseDto(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    // Constructor para error con código
    public ApiResponseDto(boolean success, String message, String errorCode) {
        this.success = success;
        this.message = message;
        this.errorCode = errorCode;
        this.timestamp = LocalDateTime.now();
    }

    // Métodos de utilidad
    public static <T> ApiResponseDto<T> success(String message) {
        return new ApiResponseDto<>(true, message);
    }

    public static <T> ApiResponseDto<T> success(String message, T data) {
        return new ApiResponseDto<>(true, message, data);
    }

    public static <T> ApiResponseDto<T> error(String message) {
        return new ApiResponseDto<>(false, message, "ERROR");
    }

    public static <T> ApiResponseDto<T> error(String message, String errorCode) {
        return new ApiResponseDto<>(false, message, errorCode);
    }

    public static <T> ApiResponseDto<T> notFound(String message) {
        return new ApiResponseDto<>(false, message, "NOT_FOUND");
    }

    public static <T> ApiResponseDto<T> unauthorized(String message) {
        return new ApiResponseDto<>(false, message, "UNAUTHORIZED");
    }

    public static <T> ApiResponseDto<T> badRequest(String message) {
        return new ApiResponseDto<>(false, message, "BAD_REQUEST");
    }

    public static <T> ApiResponseDto<T> conflict(String message) {
        return new ApiResponseDto<>(false, message, "CONFLICT");
    }
}
