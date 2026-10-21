<?php
// ENDPOINT PRIVADO: registra la compra de una entrada para el usuario logueado.
require_once '../config/sesion.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(["estado" => "error", "mensaje" => "Acceso no autorizado. Iniciá sesión para comprar."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["estado" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

require_once '../config/conexion.php';

// Catálogo del lado del servidor: el precio NUNCA se toma del cliente.
$CATALOGO = [
    'bts'      => ['titulo' => 'BTS World Tour ARIRANG', 'precio' => 45000],
    'olivia'   => ['titulo' => 'Olivia Wald',            'precio' => 80000],
    'maroon5'  => ['titulo' => 'Maroon 5',               'precio' => 75000],
    'calamaro' => ['titulo' => 'Andrés Calamaro',        'precio' => 65000],
];
$MEDIOS_PAGO = ['tarjeta_credito', 'tarjeta_debito', 'transferencia', 'efectivo'];

$input     = json_decode(file_get_contents('php://input'), true);
$evento    = $input['tickets']   ?? '';
$pago      = $input['pago']      ?? '';
$direccion = trim($input['direccion'] ?? '');
$telefono  = trim($input['telefono']  ?? '');

if (!is_string($evento) || !isset($CATALOGO[$evento]) || !in_array($pago, $MEDIOS_PAGO, true)) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Datos de compra inválidos."]);
    exit;
}
if (mb_strlen($direccion) > 200 || mb_strlen($telefono) > 30) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Dirección o teléfono demasiado largo."]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO compras (usuario_id, evento_clave, evento_titulo, precio, medio_pago, direccion, telefono)
         VALUES (:uid, :clave, :titulo, :precio, :pago, :dir, :tel)'
    );
    $stmt->execute([
        'uid'    => $_SESSION['usuario_id'],
        'clave'  => $evento,
        'titulo' => $CATALOGO[$evento]['titulo'],
        'precio' => $CATALOGO[$evento]['precio'],
        'pago'   => $pago,
        'dir'    => $direccion !== '' ? $direccion : null,
        'tel'    => $telefono  !== '' ? $telefono  : null,
    ]);

    http_response_code(201);
    echo json_encode(["estado" => "exito", "mensaje" => "Compra registrada correctamente."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["estado" => "error", "mensaje" => "Error interno al registrar la compra."]);
}
