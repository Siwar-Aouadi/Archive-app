import React, { useState } from "react";
import axios from "axios";
import "./LoginForm.css";
import logo from "../assets/logoTT.png";

function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });

      const { message, role } = response.data;
      setMessage("✅ Connexion réussie !");
      localStorage.setItem("role", role); // Enregistre le rôle
      onLoginSuccess(role); // Transmet le rôle à App.js
    } catch (err) {
      console.error("Erreur de connexion :", err);
      setMessage("❌ Identifiants invalides !");
    }
  };

  return (
    <div className="tt-container">
      <div className="tt-card">
        <img src={logo} alt="Logo TT" className="tt-logo" />
        <h2>Bienvenue à l'archive TT</h2>
        <p className="tt-subtext">Veuillez vous connecter à votre compte</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="tt-login-button">Se connecter</button>
          <div className="tt-forgot">
            <a href="#">Mot de passe oublié ?</a>
          </div>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default LoginForm;
