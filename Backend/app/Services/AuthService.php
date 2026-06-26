<?php

class AuthService
{
    
    public function attemptLogin($email, $password)
    {
    
        $mockUser = [
            'id' => 1,
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => '123456'
        ];

        if (
            $email === $mockUser['email'] &&
            $password === $mockUser['password']
        ) {
            return $mockUser;
        }

        return null;
    }
}