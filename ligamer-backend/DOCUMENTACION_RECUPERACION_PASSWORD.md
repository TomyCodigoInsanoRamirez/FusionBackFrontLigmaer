# 📧 Recuperación de Contraseña - Documentación para Figma

## ¿Cómo funciona la recuperación de contraseña?

### Endpoint: `/api/auth/forgot-password`

**Método:** POST  
**Content-Type:** application/json

### Parámetros que recibe:

```json
{
  "email": "usuario@ejemplo.com"
}
```

**Solo recibe un parámetro:**
- `email` (String): El correo electrónico del usuario que olvidó su contraseña

### Flujo completo:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario ingresa su email en la pantalla de Figma            │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /api/auth/forgot-password                               │
│    Body: { "email": "user@example.com" }                        │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend valida que el email exista                           │
│    - Si NO existe: Error "Usuario no encontrado"                │
│    - Si existe: Continúa ↓                                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Genera token único UUID y fecha de expiración (15 min)       │
│    - token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"             │
│    - expiry: 2025-11-16 11:15:00                                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Guarda token en la base de datos                             │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PUBLICA EVENTO: PasswordResetRequestedEvent                  │
│    (Arquitectura basada en eventos - Asíncrono)                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Backend responde INMEDIATAMENTE:                             │
│    Status: 200 OK                                                │
│    Body: "Hemos enviado un enlace a tu correo para              │
│           restablecer tu contraseña..."                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. EN SEGUNDO PLANO (Asíncrono):                                │
│    EmailNotificationListener escucha el evento y envía email    │
│    con el link: http://localhost:3000/reset-password?token=...  │
└─────────────────────────────────────────────────────────────────┘
```

## Para tu pantalla de Figma:

### Pantalla 1: Solicitar recuperación
**Elementos necesarios:**
- ✉️ Campo de texto: Email
- 🔘 Botón: "Enviar enlace de recuperación"
- ℹ️ Mensaje de ayuda: "Te enviaremos un email con instrucciones"

### Pantalla 2: Confirmación (después del POST exitoso)
**Mensaje a mostrar:**
> "Hemos enviado un enlace a tu correo para restablecer tu contraseña. Haz clic en él para seguir con el proceso."

**Tiempo de expiración:**
> ⏰ El enlace expira en 15 minutos

### Pantalla 3: Email recibido
**Contenido del email:**
```
Asunto: Restablecimiento de Contraseña - LIGAMER

Hola,

Has solicitado restablecer tu contraseña. 
Haz clic en el siguiente enlace para continuar:

http://localhost:3000/reset-password?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890

Si no solicitaste esto, por favor ignora este correo.

El enlace caducará en 15 minutos.
```

### Pantalla 4: Restablecer contraseña (al hacer clic en el link)
**URL:** `http://localhost:3000/reset-password?token=<token>`

**Elementos necesarios:**
- 🔒 Campo de texto: Nueva contraseña (type="password")
- 🔒 Campo de texto: Confirmar nueva contraseña (type="password")
- 🔘 Botón: "Restablecer contraseña"

**Endpoint a llamar:**
```
POST /api/auth/reset-password
Body: {
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "newPassword": "NuevaContraseña123!"
}
```

### Pantalla 5: Confirmación final
**Mensaje de éxito:**
> "Tu contraseña ha sido actualizada. Ya puedes iniciar sesión."

---

## Posibles errores a manejar:

### Al solicitar recuperación (forgot-password):
- ❌ Email no existe: `"Usuario no encontrado con el email: xxx"`
- ❌ Email vacío: Validación en frontend

### Al restablecer (reset-password):
- ❌ Token inválido: `"Token de restablecimiento inválido."`
- ❌ Token expirado: `"El enlace de restablecimiento ha caducado. Por favor, solicita uno nuevo."`
- ❌ Contraseña vacía: Validación en frontend
- ❌ Contraseñas no coinciden: Validación en frontend

---

## Resumen de DTOs para Figma:

### ForgotPasswordDto
```typescript
interface ForgotPasswordDto {
  email: string;
}
```

### ResetPasswordDto
```typescript
interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
```

---

## Ejemplo de flujo en Figma:

1. **Pantalla Login** → "¿Olvidaste tu contraseña?" (link)
2. **Pantalla Recuperación** → Ingresar email → Botón "Enviar"
3. **Pantalla Confirmación** → Mensaje: "Revisa tu email"
4. **[Usuario revisa email]**
5. **Pantalla Nueva Contraseña** → Ingresar nueva contraseña (2 veces)
6. **Pantalla Éxito** → "Contraseña actualizada" → Botón "Ir al login"

---

**Fecha:** 16 de Noviembre, 2025  
**Proyecto:** LIGAMER Backend - Arquitectura Basada en Eventos

