<?php

class Database
{
    private $host = "localhost";
    private $port = "5432";
    private $db_name = "condohub";
    private $username = "postgres";
    private $password = "sua_senha_aqui";
    public $conn;

    public function getConnection()
    {
        $this->conn = null;

        try {
            
            $this->conn = new PDO(
                "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name}",
                $this->username,
                $this->password
            );

            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch (PDOException $e) {
            die("Erro de conexão: " . $e->getMessage());
        }

        return $this->conn;
    }
}