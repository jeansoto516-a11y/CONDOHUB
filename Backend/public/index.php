<?php

declare(strict_types=1);

session_start();

define('BASE_PATH', dirname(__DIR__));
define('DATA_PATH', BASE_PATH . '/database/condohub.sqlite');

header_remove('X-Powered-By');

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    if (!is_dir(dirname(DATA_PATH))) {
        mkdir(dirname(DATA_PATH), 0777, true);
    }

    $pdo = new PDO('sqlite:' . DATA_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');

    migrate($pdo);
    seed($pdo);

    return $pdo;
}

function migrate(PDO $pdo): void
{
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS condos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            units_count INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS residents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condo_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            unit TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'morador',
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condo_id INTEGER NOT NULL,
            resident_id INTEGER,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'media',
            status TEXT NOT NULL DEFAULT 'aberto',
            description TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condo_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            publish_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS packages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condo_id INTEGER NOT NULL,
            resident_id INTEGER,
            recipient TEXT NOT NULL,
            unit TEXT NOT NULL,
            carrier TEXT,
            tracking_code TEXT,
            status TEXT NOT NULL DEFAULT 'recebida',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            delivered_at TEXT,
            FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            condo_id INTEGER NOT NULL,
            resident_id INTEGER,
            space TEXT NOT NULL,
            starts_at TEXT NOT NULL,
            ends_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (condo_id) REFERENCES condos(id) ON DELETE CASCADE,
            FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
        );
    ");
}

function seed(PDO $pdo): void
{
    if ((int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn() === 0) {
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
        $stmt->execute(['Administrador', 'admin@condohub.com', password_hash('123456', PASSWORD_DEFAULT), 'admin']);
    }

    if ((int) $pdo->query('SELECT COUNT(*) FROM condos')->fetchColumn() > 0) {
        return;
    }

    $pdo->beginTransaction();
    $pdo->prepare('INSERT INTO condos (name, address, city, units_count) VALUES (?, ?, ?, ?)')
        ->execute(['Residencial Jardim Aurora', 'Av. Central, 1200', 'Sao Paulo', 128]);
    $condoId = (int) $pdo->lastInsertId();

    $residents = [
        ['Marina Costa', 'marina@email.com', '(11) 99999-0001', 'A-102', 'proprietario'],
        ['Rafael Lima', 'rafael@email.com', '(11) 99999-0002', 'B-204', 'morador'],
        ['Bianca Torres', 'bianca@email.com', '(11) 99999-0003', 'C-301', 'inquilino'],
    ];
    $residentStmt = $pdo->prepare('INSERT INTO residents (condo_id, name, email, phone, unit, type) VALUES (?, ?, ?, ?, ?, ?)');
    foreach ($residents as $resident) {
        $residentStmt->execute([$condoId, ...$resident]);
    }

    $pdo->prepare('INSERT INTO tickets (condo_id, resident_id, title, category, priority, status, description) VALUES (?, 1, ?, ?, ?, ?, ?)')
        ->execute([$condoId, 'Vazamento na garagem', 'manutencao', 'alta', 'em_andamento', 'Infiltracao proxima a vaga 42.']);
    $pdo->prepare('INSERT INTO notices (condo_id, title, body) VALUES (?, ?, ?)')
        ->execute([$condoId, 'Assembleia ordinaria', 'Assembleia marcada para sexta-feira, 19h, no salao principal.']);
    $pdo->prepare('INSERT INTO packages (condo_id, resident_id, recipient, unit, carrier, tracking_code) VALUES (?, 2, ?, ?, ?, ?)')
        ->execute([$condoId, 'Rafael Lima', 'B-204', 'Correios', 'BR123456789']);
    $pdo->prepare('INSERT INTO reservations (condo_id, resident_id, space, starts_at, ends_at, status, notes) VALUES (?, 3, ?, ?, ?, ?, ?)')
        ->execute([$condoId, 'Salao de festas', date('Y-m-d 18:00:00', strtotime('+3 days')), date('Y-m-d 23:00:00', strtotime('+3 days')), 'aprovada', 'Aniversario familiar']);

    $pdo->commit();
}

function jsonResponse(mixed $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '[]', true);
    return is_array($data) ? $data : [];
}

function requireAuth(): array
{
    if (!isset($_SESSION['user'])) {
        jsonResponse(['message' => 'Nao autenticado.'], 401);
    }

    return $_SESSION['user'];
}

function validateRequired(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            jsonResponse(['message' => "Campo obrigatorio: {$field}"], 422);
        }
    }
}

function tableList(string $table): array
{
    $allowed = ['condos', 'residents', 'tickets', 'notices', 'packages', 'reservations'];
    if (!in_array($table, $allowed, true)) {
        jsonResponse(['message' => 'Recurso invalido.'], 404);
    }

    return db()->query("SELECT * FROM {$table} ORDER BY id DESC")->fetchAll();
}

function insertRow(string $table, array $data, array $fields): array
{
    $columns = [];
    $values = [];

    foreach ($fields as $field) {
        if (array_key_exists($field, $data)) {
            $columns[] = $field;
            $values[] = $data[$field];
        }
    }

    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $sql = sprintf('INSERT INTO %s (%s) VALUES (%s)', $table, implode(', ', $columns), $placeholders);
    $stmt = db()->prepare($sql);
    $stmt->execute($values);

    $id = (int) db()->lastInsertId();
    $stmt = db()->prepare("SELECT * FROM {$table} WHERE id = ?");
    $stmt->execute([$id]);

    return $stmt->fetch();
}

function updateStatus(string $table, int $id, string $status): array
{
    $stmt = db()->prepare("UPDATE {$table} SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    $stmt = db()->prepare("SELECT * FROM {$table} WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse(['message' => 'Registro nao encontrado.'], 404);
    }

    return $row;
}

function dashboard(): array
{
    $pdo = db();
    $one = fn (string $sql) => (int) $pdo->query($sql)->fetchColumn();

    return [
        'condos' => $one('SELECT COUNT(*) FROM condos'),
        'residents' => $one('SELECT COUNT(*) FROM residents'),
        'open_tickets' => $one("SELECT COUNT(*) FROM tickets WHERE status IN ('aberto', 'em_andamento')"),
        'pending_packages' => $one("SELECT COUNT(*) FROM packages WHERE status = 'recebida'"),
        'pending_reservations' => $one("SELECT COUNT(*) FROM reservations WHERE status = 'pendente'"),
        'latest_tickets' => $pdo->query('SELECT tickets.*, condos.name AS condo_name FROM tickets JOIN condos ON condos.id = tickets.condo_id ORDER BY tickets.id DESC LIMIT 5')->fetchAll(),
        'latest_notices' => $pdo->query('SELECT notices.*, condos.name AS condo_name FROM notices JOIN condos ON condos.id = notices.condo_id ORDER BY notices.id DESC LIMIT 5')->fetchAll(),
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/api/')) {
    try {
        if ($method === 'POST' && $path === '/api/login') {
            $data = input();
            validateRequired($data, ['email', 'password']);

            $stmt = db()->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?');
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch();

            if (!$user || !password_verify((string) $data['password'], $user['password_hash'])) {
                jsonResponse(['message' => 'Email ou senha invalidos.'], 401);
            }

            unset($user['password_hash']);
            $_SESSION['user'] = $user;
            jsonResponse(['user' => $user]);
        }

        if ($method === 'POST' && $path === '/api/logout') {
            session_destroy();
            jsonResponse(['ok' => true]);
        }

        if ($method === 'GET' && $path === '/api/me') {
            jsonResponse(['user' => $_SESSION['user'] ?? null]);
        }

        requireAuth();

        if ($method === 'GET' && $path === '/api/dashboard') {
            jsonResponse(dashboard());
        }

        $routes = [
            '/api/condos' => ['table' => 'condos', 'required' => ['name', 'address', 'city'], 'fields' => ['name', 'address', 'city', 'units_count', 'status']],
            '/api/residents' => ['table' => 'residents', 'required' => ['condo_id', 'name', 'unit'], 'fields' => ['condo_id', 'name', 'email', 'phone', 'unit', 'type', 'status']],
            '/api/tickets' => ['table' => 'tickets', 'required' => ['condo_id', 'title', 'category'], 'fields' => ['condo_id', 'resident_id', 'title', 'category', 'priority', 'status', 'description']],
            '/api/notices' => ['table' => 'notices', 'required' => ['condo_id', 'title', 'body'], 'fields' => ['condo_id', 'title', 'body', 'publish_at']],
            '/api/packages' => ['table' => 'packages', 'required' => ['condo_id', 'recipient', 'unit'], 'fields' => ['condo_id', 'resident_id', 'recipient', 'unit', 'carrier', 'tracking_code', 'status']],
            '/api/reservations' => ['table' => 'reservations', 'required' => ['condo_id', 'space', 'starts_at', 'ends_at'], 'fields' => ['condo_id', 'resident_id', 'space', 'starts_at', 'ends_at', 'status', 'notes']],
        ];

        if (isset($routes[$path])) {
            $route = $routes[$path];
            if ($method === 'GET') {
                jsonResponse(tableList($route['table']));
            }

            if ($method === 'POST') {
                $data = input();
                validateRequired($data, $route['required']);
                jsonResponse(insertRow($route['table'], $data, $route['fields']), 201);
            }
        }

        if ($method === 'PATCH' && preg_match('#^/api/(tickets|packages|reservations)/(\d+)/status$#', $path, $matches)) {
            $data = input();
            validateRequired($data, ['status']);
            jsonResponse(updateStatus($matches[1], (int) $matches[2], (string) $data['status']));
        }

        jsonResponse(['message' => 'Rota nao encontrada.'], 404);
    } catch (Throwable $exception) {
        jsonResponse(['message' => 'Erro interno.', 'detail' => $exception->getMessage()], 500);
    }
}

$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false;
}

require __DIR__ . '/index.html';
