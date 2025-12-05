# LIGAMER Backend - Arquitectura Basada en Eventos

## 📋 Descripción

Este proyecto ha sido transformado a una **Arquitectura Basada en Eventos (Event-Driven Architecture)** utilizando el patrón de eventos de dominio de Spring Framework.

## 🏗️ Arquitectura

### Componentes Principales

#### 1. **Eventos de Dominio** (`events/`)
Los eventos son objetos inmutables que representan algo que ha ocurrido en el sistema:

- **UserRegisteredEvent**: Usuario se ha registrado
- **PasswordResetRequestedEvent**: Solicitud de recuperación de contraseña
- **PasswordResetCompletedEvent**: Contraseña restablecida exitosamente
- **UserProfileUpdatedEvent**: Perfil de usuario actualizado
- **TeamCreatedEvent**: Equipo creado
- **TeamUpdatedEvent**: Equipo actualizado
- **TeamDeletedEvent**: Equipo eliminado
- **JoinRequestCreatedEvent**: Solicitud de unión creada
- **JoinRequestAcceptedEvent**: Solicitud de unión aceptada
- **JoinRequestRejectedEvent**: Solicitud de unión rechazada
- **UserLeftTeamEvent**: Usuario abandonó un equipo

#### 2. **Publicadores de Eventos** (`services/`)
Los servicios publican eventos cuando ocurren acciones importantes:

```java
// Ejemplo: UserService
eventPublisher.publishEvent(new UserRegisteredEvent(this, 
    savedUser.getEmail(), 
    savedUser.getId(), 
    userRole.getName()));
```

#### 3. **Listeners de Eventos** (`listeners/`)

##### EmailNotificationListener
- Escucha eventos y envía notificaciones por email de forma **asíncrona**
- Maneja: registro, recuperación de contraseña, confirmaciones, etc.

##### AuditLogListener
- Registra todas las acciones importantes en logs para auditoría
- Ejecuta de forma **asíncrona** sin bloquear el flujo principal

#### 4. **Configuración Asíncrona** (`config/AsyncEventConfig`)
- Habilita la ejecución asíncrona de eventos
- Los listeners no bloquean la respuesta HTTP al usuario

## 🎯 Ventajas de la Arquitectura Basada en Eventos

### 1. **Desacoplamiento**
- Los servicios no dependen directamente de JavaMailSender u otros servicios
- Fácil agregar nuevos listeners sin modificar código existente

### 2. **Escalabilidad**
- Los eventos se procesan de forma asíncrona
- No afecta el tiempo de respuesta de las APIs

### 3. **Mantenibilidad**
- Responsabilidades claramente separadas
- Código más limpio y organizado

### 4. **Extensibilidad**
- Fácil agregar nuevas funcionalidades:
  - Notificaciones push
  - Webhooks
  - Integración con servicios externos
  - Métricas y analytics

### 5. **Auditoría**
- Trazabilidad completa de todas las acciones
- Logs centralizados y estructurados

## 📊 Flujo de un Evento

```
┌─────────────┐
│  Controller │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │────► Publica Evento
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Repository │ (Guarda en BD)
└──────┬──────┘
       │
       ▼
   Responde
   al usuario
   
   (Asíncrono)
       │
       ▼
┌─────────────────┐
│ Event Listeners │
├─────────────────┤
│ • Email         │
│ • Audit Log     │
│ • Metrics       │
│ • etc.          │
└─────────────────┘
```

## 🔧 Cómo Agregar un Nuevo Evento

### 1. Crear el Evento
```java
@Getter
public class MiNuevoEvent extends ApplicationEvent {
    private final String dato;
    
    public MiNuevoEvent(Object source, String dato) {
        super(source);
        this.dato = dato;
    }
}
```

### 2. Publicar el Evento
```java
eventPublisher.publishEvent(new MiNuevoEvent(this, "valor"));
```

### 3. Crear el Listener
```java
@Component
public class MiListener {
    
    @Async
    @EventListener
    public void handleMiNuevoEvent(MiNuevoEvent event) {
        // Procesar evento
        logger.info("Evento recibido: {}", event.getDato());
    }
}
```

## 📝 Ejemplo de Uso

### Registro de Usuario

**Antes (Arquitectura Tradicional):**
```java
public User registerNewUser(UserDto userDto) {
    // ... validación ...
    User savedUser = userRepository.save(newUser);
    
    // Envío directo de email (bloqueante)
    mailSender.send(welcomeEmail);
    
    return savedUser;
}
```

**Después (Arquitectura Basada en Eventos):**
```java
public User registerNewUser(UserDto userDto) {
    // ... validación ...
    User savedUser = userRepository.save(newUser);
    
    // Publica evento (no bloqueante)
    eventPublisher.publishEvent(new UserRegisteredEvent(
        this, savedUser.getEmail(), savedUser.getId(), userRole.getName()));
    
    return savedUser; // Responde inmediatamente
}

// El envío de email ocurre de forma asíncrona en el listener
```

## 🚀 Ejecución

El proyecto funciona igual que antes. Los eventos se procesan automáticamente en segundo plano:

```bash
./mvnw spring-boot:run
```

## 📧 Notificaciones por Email

Los siguientes eventos desencadenan emails automáticos:

1. **Registro de usuario** → Email de bienvenida
2. **Recuperación de contraseña** → Email con token
3. **Contraseña restablecida** → Email de confirmación
4. **Solicitud aceptada** → Email de aceptación
5. **Solicitud rechazada** → Email de rechazo

## 🔍 Auditoría

Todos los eventos se registran en logs con el formato:

```
🔍 AUDIT: [Acción] - [Detalles relevantes]
```

Ejemplo:
```
🔍 AUDIT: Usuario registrado - Email: user@example.com, UserId: 1, Rol: ROLE_JUGADOR
🔍 AUDIT: Equipo creado - TeamId: 5, Nombre: Warriors, Creador: owner@example.com
```

## ⚙️ Configuración

La configuración de eventos asíncronos está en `AsyncEventConfig.java`:

```java
@Configuration
@EnableAsync
public class AsyncEventConfig {
    @Bean(name = "applicationEventMulticaster")
    public ApplicationEventMulticaster simpleApplicationEventMulticaster() {
        SimpleApplicationEventMulticaster eventMulticaster = 
            new SimpleApplicationEventMulticaster();
        eventMulticaster.setTaskExecutor(new SimpleAsyncTaskExecutor());
        return eventMulticaster;
    }
}
```

## 🎓 Conceptos Clave

- **Event Publisher**: Publica eventos cuando ocurre algo importante
- **Event Listener**: Escucha y reacciona a eventos específicos
- **@Async**: Ejecuta el listener en un hilo separado
- **@EventListener**: Marca un método como manejador de eventos
- **ApplicationEvent**: Clase base para todos los eventos

## 📚 Referencias

- [Spring Events Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#context-functionality-events)
- [Event-Driven Architecture Patterns](https://martinfowler.com/articles/201701-event-driven.html)

---

**Autor**: LIGAMER Development Team  
**Fecha**: Noviembre 2025

