<?php

class Router
{
    private $routes = [];

    // Método GET
    public function get($path, $callback)
    {
        $this->routes['GET'][$path] = $callback;
    }

    // Método para executar rota
    public function run()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        $callback = $this->routes[$method][$uri] ?? null;

        if ($callback) {
            call_user_func($callback);
        } else {
            http_response_code(404);
            echo "404 - Página não encontrada";
        }
    }
}