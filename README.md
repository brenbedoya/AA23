# TicketShow - Trabajo Práctico

## Pasos para probarlo localmente

### 1. Clonar o descargar el repositorio
Clonar o descargar este repositorio dentro de la carpeta `htdocs` de XAMPP. Por ejemplo:

```text
C:/xampp/htdocs/AA23/
```

### 2. Iniciar los servicios de XAMPP
Abrir el panel de control de **XAMPP** e iniciar los servicios de **Apache** y **MySQL**.

### 3. Importar la base de datos

1. Ingresar a [phpMyAdmin](http://localhost/phpmyadmin).
2. Crear una base de datos con el nombre `ticketshow`.
3. Ir a la pestaña **Importar**.
4. Seleccionar el archivo SQL ubicado en la carpeta del proyecto: `sql/ticketshow.sql`.
5. Ejecutar la importación.

### 4. Verificar las credenciales de conexión
Abrir el archivo `config/conexion.php` y verificar las credenciales de la base de datos.

Por defecto, el usuario es `root` y la contraseña está vacía (`''`), aunque puede variar según la configuración de XAMPP.

### 5. Acceder a la aplicación
Abrir el navegador e ingresar a la siguiente dirección:

[http://localhost/AA23/proyecto/registro.html](http://localhost/AA23/proyecto/registro.html)

