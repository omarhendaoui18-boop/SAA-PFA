CREATE DATABASE IF NOT EXISTS saa_database;
USE saa_database;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'enseignant', 'etudiant') NOT NULL,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE etudiants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    filiere VARCHAR(100),
    niveau VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insérer un admin par défaut (Email: admin@saa.com / Mdp: admin123)
INSERT INTO users (email, password, role) VALUES 
('admin@saa.com', '$2a$10$XmEz0V3l6sH2k.q9wJW.u.R8zZ5lZ6/q5h0L9G5h2V8Z5lZ6/q5h0a', 'admin');