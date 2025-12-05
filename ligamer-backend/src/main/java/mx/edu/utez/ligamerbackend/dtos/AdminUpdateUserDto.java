package mx.edu.utez.ligamerbackend.dtos;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserDto {
    @NotNull
    private Boolean active;
}
