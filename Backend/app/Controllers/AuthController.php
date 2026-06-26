<?php

class AuthController
{
    private $authService;

    public function __construct()
    {
        require_once BASE_PATH . '/app/services/AuthService.php';
        $this->authService = new AuthService();
    }

    public function loginForm()
    {
        echo '
        <h2>Login</h2>
        <form method="POST" action="/login">
            <input type="email" name="email" placeholder="Email" required><br><br>
            <input type="password" name="password" placeholder="Senha" required><br><br>
            <button type="submit">Entrar</button>
        </form>
        ';
    }

    public function login()
    {
        session_start();

        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        $user = $this->authService->attemptLogin($email, $password);

        if ($user) {
            $_SESSION['user'] = $user;

            header("Location: /dashboard");
            exit;
        }

        echo "Login inválido ❌";
    }

    public function logout()
    {
        session_start();
        session_destroy();

        header("Location: /login");
        exit;
    }
}