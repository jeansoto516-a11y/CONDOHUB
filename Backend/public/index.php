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

require BASE_PATH . '/app/helpers/AuthHelper.php';

$router = new Router();

$auth = new AuthController();

$router->get('/login', function () use ($auth) {
    $auth->loginForm();
});

$router->post('/login', function () use ($auth) {
    $auth->login();
});

$router->get('/logout', function () use ($auth) {
    $auth->logout();
});

$router->get('/dashboard', function () {

    AuthHelper::check();

    echo "<h2>Dashboard</h2>";
    echo "Bem-vindo, " . $_SESSION['user']['name'];

    echo "<br><br><a href='/logout'>Sair</a>";
});

$router->run();