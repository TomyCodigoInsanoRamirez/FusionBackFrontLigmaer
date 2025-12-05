package mx.edu.utez.ligamerbackend.repositories;

import mx.edu.utez.ligamerbackend.models.User;
import mx.edu.utez.ligamerbackend.models.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetPasswordToken(String token);
    
    @Query("SELECT t FROM Team t JOIN t.members m WHERE m.id = :userId")
    Team findTeamByMemberId(@Param("userId") Long userId);
    
    @Query("SELECT t FROM Team t WHERE t.owner.id = :userId")
    Team findTeamByOwnerId(@Param("userId") Long userId);
}