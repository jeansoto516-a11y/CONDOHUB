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

$router = new Router();

$router->get('/', function () {
    echo "Backend PHP rodando 🚀";
});

$router->run();