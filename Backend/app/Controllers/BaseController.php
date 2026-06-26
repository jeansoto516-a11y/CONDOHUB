<?php

class BaseController
{
    protected $db;

    public function __construct($db)
    {
        $this->db = $db;
    }
}