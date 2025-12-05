package mx.edu.utez.ligamerbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "mx.edu.utez.ligamerbackend.repositories")
public class LigamerBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LigamerBackendApplication.class, args);
    }

}