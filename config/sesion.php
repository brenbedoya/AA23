<?php
// Parámetros seguros de la cookie de sesión.
// Se incluye ANTES de llamar a session_start() en cada endpoint.
session_set_cookie_params([
    'lifetime' => 0,          // dura hasta cerrar el navegador
    'path'     => '/',
    'httponly' => true,       // JavaScript no puede leer la cookie (mitiga XSS)
    'samesite' => 'Lax',      // mitiga CSRF
    'secure'   => !empty($_SERVER['HTTPS']),
]);
