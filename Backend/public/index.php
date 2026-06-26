<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

define('BASE_PATH', dirname(__DIR__));

spl_autoload_register(function ($class) {
    $file = BASE_PATH . '/' . str_replace('\\', '/', $class) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

require BASE_PATH . '/core/Router.php';
require BASE_PATH . '/app/controllers/AuthController.php';

$router = new Router();

$auth = new AuthController();

$router->get('/login', function () use ($auth) {
    $auth->loginForm();
});

$router->post('/login', function () use ($auth) {
    $auth->login();
});

$router->get('/dashboard', function () {
    session_start();

    if (!isset($_SESSION['user'])) {
        header("Location: /login");
        exit;
    }

    echo "Bem-vindo, " . $_SESSION['user']['name'];
});

$router->get('/logout', function () use ($auth) {
    $auth->logout();
});

$router->run();