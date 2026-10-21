<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../config/conexion.php';
require_once '../config/sesion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["estado" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

$input    = json_decode(file_get_contents('php://input'), true);
$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Ingresá e-mail y contraseña."]);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, nombre, apellido, email, password, rol FROM usuarios WHERE email = :email');
    $stmt->execute(['email' => $email]);
    $usuario = $stmt->fetch();

    if ($usuario && password_verify($password, $usuario['password'])) {
        // Inicializamos la sesión en el servidor
        session_start();
        session_regenerate_id(true); // evita fijación de sesión

        $_SESSION['usuario_id']       = $usuario['id'];
        $_SESSION['usuario_nombre']   = $usuario['nombre'];
        $_SESSION['usuario_apellido'] = $usuario['apellido'];
        $_SESSION['usuario_email']    = $usuario['email'];
        $_SESSION['usuario_rol']      = $usuario['rol'];

        http_response_code(200);
        echo json_encode([
            "estado"  => "exito",
            "mensaje" => "Autenticación exitosa.",
            "usuario" => [
                "nombre"   => $usuario['nombre'],
                "apellido" => $usuario['apellido'],
                "email"    => $usuario['email'],
                "rol"      => $usuario['rol']
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(401); // Unauthorized
        echo json_encode(["estado" => "error", "mensaje" => "Credenciales incorrectas."]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => "Error interno del servidor."]);
}
