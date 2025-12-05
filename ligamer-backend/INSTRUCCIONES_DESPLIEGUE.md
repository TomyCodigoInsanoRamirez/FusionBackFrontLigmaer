# Instrucciones de Despliegue - Actualización del Registro de Usuarios

**Fecha:** 18 de Noviembre, 2025  
**Versión:** 1.0

## ⚠️ IMPORTANTE - Leer antes de continuar

Esta actualización agrega campos obligatorios a la tabla `users`. Es necesario ejecutar el script de migración SQL **ANTES** de desplegar la nueva versión del código.

## Pasos de Despliegue

### 1. Backup de la Base de Datos (OBLIGATORIO)

Antes de realizar cualquier cambio, haz un backup completo de tu base de datos:

```bash
# Para PostgreSQL
pg_dump -U tu_usuario -d nombre_base_datos > backup_$(date +%Y%m%d_%H%M%S).sql

# Para MySQL
mysqldump -u tu_usuario -p nombre_base_datos > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Ejecutar el Script de Migración

Ejecuta el archivo `migration_add_user_fields.sql` en tu base de datos:

```bash
# Para PostgreSQL
psql -U tu_usuario -d nombre_base_datos -f migration_add_user_fields.sql

# Para MySQL (si usas MySQL en lugar de PostgreSQL)
# Necesitarás modificar el script para MySQL primero
mysql -u tu_usuario -p nombre_base_datos < migration_add_user_fields.sql
```

### 3. Verificar la Migración

Ejecuta este query para verificar que los campos se agregaron correctamente:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('nombre', 'apellido_paterno', 'apellido_materno');
```

Deberías ver:
- `nombre`: VARCHAR(100), NOT NULL
- `apellido_paterno`: VARCHAR(100), NOT NULL
- `apellido_materno`: VARCHAR(100), NULL

### 4. Compilar el Proyecto

```bash
cd "/Users/rubengo/Documentos/UTEZ/ING/1re Cuatrimestre/Arquitectura de Software/LIGAMER/ligamer-backend"
./mvnw clean package -DskipTests
```

### 5. Detener la Aplicación Actual

Detén la aplicación que esté corriendo actualmente.

### 6. Desplegar la Nueva Versión

```bash
# Opción 1: Ejecutar directamente
java -jar target/sicotof-backend-0.0.1-SNAPSHOT.jar

# Opción 2: Ejecutar como servicio (si ya tienes configurado un servicio)
sudo systemctl restart ligamer-backend
```

### 7. Verificar el Despliegue

#### 7.1 Verificar que la aplicación inició correctamente

Revisa los logs para confirmar que no hay errores:

```bash
# Si usas systemd
sudo journalctl -u ligamer-backend -f

# Si ejecutaste directamente, revisa la consola
```

#### 7.2 Probar el endpoint de registro

Usa curl o Postman para probar el endpoint de registro:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellidoPaterno": "Pérez",
    "apellidoMaterno": "García",
    "email": "juan.perez@test.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#"
  }'
```

Deberías recibir:
```
¡Bienvenido! Tu cuenta ha sido creada exitosamente.
```

#### 7.3 Probar endpoint de login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@test.com",
    "password": "Test123!@#"
  }'
```

Deberías recibir un token JWT.

#### 7.4 Probar endpoint de perfil

```bash
# Primero obtén el token del paso anterior
TOKEN="tu_token_jwt_aqui"

curl -X GET http://localhost:8080/api/profile \
  -H "Authorization: Bearer $TOKEN"
```

Deberías recibir:
```json
{
  "id": 1,
  "nombre": "Juan",
  "apellidoPaterno": "Pérez",
  "apellidoMaterno": "García",
  "email": "juan.perez@test.com",
  "active": true,
  "role": "ROLE_JUGADOR"
}
```

## Pruebas Adicionales

### Validación de Contraseñas

#### Contraseña débil:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellidoPaterno": "User",
    "email": "test@test.com",
    "password": "123",
    "confirmPassword": "123"
  }'
```

Debería devolver error: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial."

#### Contraseñas no coinciden:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellidoPaterno": "User",
    "email": "test@test.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#Different"
  }'
```

Debería devolver error: "Las contraseñas no coinciden. Por favor, verificarlas."

#### Email duplicado:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellidoPaterno": "User",
    "email": "juan.perez@test.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#"
  }'
```

Debería devolver error: "Ya hay una cuenta asociada al correo juan.perez@test.com. Intenta con uno diferente."

## Rollback (En caso de problemas)

Si encuentras problemas y necesitas revertir los cambios:

### 1. Detener la aplicación nueva

```bash
# Si es un servicio
sudo systemctl stop ligamer-backend

# Si está corriendo directamente, usa Ctrl+C
```

### 2. Restaurar la base de datos desde el backup

```bash
# Para PostgreSQL
psql -U tu_usuario -d nombre_base_datos < backup_YYYYMMDD_HHMMSS.sql

# Para MySQL
mysql -u tu_usuario -p nombre_base_datos < backup_YYYYMMDD_HHMMSS.sql
```

### 3. Desplegar la versión anterior del código

Vuelve a desplegar el JAR anterior que tenías funcionando.

## Notas Importantes

1. **No omitas el backup:** Siempre haz un backup antes de ejecutar migraciones.
2. **Orden de ejecución:** Ejecuta PRIMERO el script SQL, LUEGO despliega el código.
3. **Usuarios existentes:** Los usuarios existentes tendrán "Usuario" como nombre y "Genérico" como apellido paterno. Deberán actualizar su perfil.
4. **Administrador por defecto:** El usuario admin tendrá:
   - Nombre: "Administrador"
   - Apellido Paterno: "Sistema"
   - Apellido Materno: "LIGAMER"

## Contacto de Soporte

Si encuentras problemas durante el despliegue, contacta al equipo de desarrollo.

---
**Documento generado automáticamente - LIGAMER Backend Team**

