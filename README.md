# TicketShow – Autenticación con PHP, BCRYPT y sesiones

## Puesta en marcha
1. Copiar la carpeta del proyecto a `htdocs` (XAMPP) o a la raíz de Apache/Nginx.
2. En phpMyAdmin → *Importar* → `sql/ticketshow.sql` (crea la base `ticketshow` con `usuarios` y `compras`).
3. Ajustar usuario/clave de MySQL en `config/conexion.php`.
4. Abrir `http://localhost/<carpeta>/index.html` (debe servirse por HTTP, no con doble clic al archivo).

## Qué se agregó
| Paso | Archivo | Detalle |
|------|---------|---------|
| 1 | `sql/ticketshow.sql` | Tablas `usuarios` (`password VARCHAR(255)`) y `compras` |
| 2 | `api/registro.php` | Recibe JSON, valida, `password_hash(..., PASSWORD_BCRYPT)`, INSERT con PDO Prepared Statements |
| 2 | `api/login.php` | `password_verify()`, `session_start()`, `session_regenerate_id(true)`, guarda `$_SESSION['usuario_id']` |
| 2 | `api/logout.php` | Destruye la sesión y la cookie |
| 3 | `api/mis_compras.php` | **Endpoint privado**: si `!isset($_SESSION['usuario_id'])` → `401` |
| 3 | `api/comprar.php` | También privado (401); el precio se toma del catálogo del servidor |
| 4 | `app.js` | `fetch()` a `api/mis_compras.php` al cargar cada página; alterna elementos con `data-visible="sesion"` / `"invitado"`; datos del usuario siempre con `.textContent` |
| 4 | `login.html`, `registro.html`, `comprar.html`, `mis_compras.html` | Formularios conectados a la API |

## Seguridad aplicada
- Contraseñas con BCRYPT (nunca se guardan en texto plano).
- PDO con consultas preparadas y `EMULATE_PREPARES = false` (anti SQL Injection).
- `session_regenerate_id(true)` al loguear (anti fijación de sesión); cookie `HttpOnly` + `SameSite=Lax`.
- 401 en endpoints privados; el `usuario_id` sale siempre de la sesión, nunca del cliente.
- Anti-XSS: el frontend usa `.textContent` / `createElement` para todo dato proveniente del servidor.
