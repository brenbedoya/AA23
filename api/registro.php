<?php
header('Content-Type: application/json; charset=utf-8');
require_once '../config/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["estado" => "error", "mensaje" => "Método no permitido."]);
    exit;
}

// Lectura del JSON entrante en el cuerpo de la petición HTTP
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Cuerpo JSON inválido."]);
    exit;
}

$nombre     = trim($input['nombre']    ?? '');
$apellido   = trim($input['apellido']  ?? '');
$email      = trim($input['email']     ?? '');
$password   = $input['password']       ?? '';
$pais       = trim($input['pais']      ?? '');
$telefono   = trim($input['telefono']  ?? '');
$tipoDoc    = trim($input['tipo_doc']  ?? '');
$documento  = trim($input['doc']       ?? '');
$genero     = trim($input['genero']    ?? '');
$newsletter = !empty($input['newsletter']) ? 1 : 0;
$nacTexto   = trim($input['nacimiento'] ?? '');

// ---- Validaciones ----
if ($nombre === '' || $apellido === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Nombre, apellido, e-mail y contraseña son obligatorios."]);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "El e-mail no es válido."]);
    exit;
}
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "La contraseña debe tener al menos 6 caracteres."]);
    exit;
}
// BCRYPT solo procesa los primeros 72 bytes
if (strlen($password) > 72) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "La contraseña no puede superar los 72 caracteres."]);
    exit;
}
if (mb_strlen($nombre) > 100 || mb_strlen($apellido) > 100) {
    http_response_code(400);
    echo json_encode(["estado" => "error", "mensaje" => "Nombre o apellido demasiado largo."]);
    exit;
}

// Fecha DD/MM/AAAA -> AAAA-MM-DD (opcional)
$nacimiento = null;
if ($nacTexto !== '') {
    $f = DateTime::createFromFormat('d/m/Y', $nacTexto);
    $errores = DateTime::getLastErrors();
    if (!$f || ($errores && ($errores['warning_count'] || $errores['error_count']))) {
        http_response_code(400);
        echo json_encode(["estado" => "error", "mensaje" => "La fecha de nacimiento debe tener el formato DD/MM/AAAA."]);
        exit;
    }
    $nacimiento = $f->format('Y-m-d');
}

// Cifrado BCRYPT de la contraseña
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

try {
    $sql = "INSERT INTO usuarios
              (nombre, apellido, email, password, pais, telefono, tipo_doc, documento, nacimiento, genero, newsletter)
            VALUES
              (:nombre, :apellido, :email, :pass, :pais, :telefono, :tipo_doc, :documento, :nacimiento, :genero, :newsletter)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'nombre'     => $nombre,
        'apellido'   => $apellido,
        'email'      => $email,
        'pass'       => $passwordHash,
        'pais'       => $pais       !== '' ? $pais      : null,
        'telefono'   => $telefono   !== '' ? $telefono  : null,
        'tipo_doc'   => $tipoDoc    !== '' ? $tipoDoc   : null,
        'documento'  => $documento  !== '' ? $documento : null,
        'nacimiento' => $nacimiento,
        'genero'     => $genero     !== '' ? $genero    : null,
        'newsletter' => $newsletter,
    ]);

    http_response_code(201); // Created
    echo json_encode(["estado" => "exito", "mensaje" => "Usuario registrado correctamente."]);

} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409); // Conflict (e-mail duplicado)
        echo json_encode(["estado" => "error", "mensaje" => "El correo electrónico ya existe."]);
    } else {
        http_response_code(500);
        echo json_encode(["estado" => "error", "mensaje" => "Error interno al registrar el usuario."]);
    }
}
