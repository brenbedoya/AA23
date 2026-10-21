<?php
// ENDPOINT PRIVADO: devuelve los datos de la sesión y las compras del usuario.
// Además lo usa el frontend para saber, al cargar cada página, si hay sesión activa.
require_once '../config/sesion.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

// Guardián de sesión: sin usuario autenticado no se devuelve nada.
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["estado" => "error", "mensaje" => "Acceso no autorizado. Iniciá sesión."]);
    exit;
}

require_once '../config/conexion.php';

try {
    // El id sale de la SESIÓN, nunca del cliente: cada usuario solo ve lo suyo.
    $stmt = $pdo->prepare(
        'SELECT id, evento_clave, evento_titulo, precio, medio_pago, creado_en
           FROM compras
          WHERE usuario_id = :uid
          ORDER BY creado_en DESC, id DESC'
    );
    $stmt->execute(['uid' => $_SESSION['usuario_id']]);
    $compras = $stmt->fetchAll();

    http_response_code(200);
    echo json_encode([
        "estado"  => "exito",
        "usuario" => [
            "id"       => $_SESSION['usuario_id'],
            "nombre"   => $_SESSION['usuario_nombre'],
            "apellido" => $_SESSION['usuario_apellido'] ?? '',
            "email"    => $_SESSION['usuario_email'] ?? '',
            "rol"      => $_SESSION['usuario_rol']
        ],
        "compras" => $compras
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => "Error interno del servidor."]);
}
