import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
    service: "",
    role: "user",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(null);
  const [message, setMessage] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement :", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/edit_user/${editUsername}`, form);
        setMessage("✅ Utilisateur modifié !");
      } else {
        await axios.post(`${API_URL}/add_user`, form);
        setMessage("✅ Utilisateur ajouté !");
      }
      setForm({ username: "", password: "", email: "", phone: "", service: "", role: "user" });
      setIsEditing(false);
      fetchUsers();
    } catch (err) {
      setMessage("❌ Erreur !");
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm("❌ Supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`${API_URL}/delete_user/${username}`);
      fetchUsers();
    } catch (err) {
      alert("Erreur de suppression");
    }
  };

  const handleEdit = (user) => {
    setForm({
      username: user.username,
      password: "",
      email: user.email,
      phone: user.phone,
      service: user.service,
      role: user.role,
    });
    setIsEditing(true);
    setEditUsername(user.username);
  };

  return (
    <div className="admin-dashboard">
      <h2>👥 Gestion des utilisateurs</h2>

      <form className="user-form" onSubmit={handleSubmit}>
        <input name="username" placeholder="Nom" value={form.username} onChange={handleChange} disabled={isEditing} />
        <input name="password" placeholder="Mot de passe" value={form.password} onChange={handleChange} type="password" />
        <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="phone" placeholder="Téléphone" value={form.phone} onChange={handleChange} />
        <input name="service" placeholder="Service" value={form.service} onChange={handleChange} />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">Utilisateur</option>
          <option value="admin">Administrateur</option>
        </select>
        <button type="submit">{isEditing ? "💾 Modifier" : "➕ Ajouter"}</button>
      </form>

      {message && <p className="message">{message}</p>}

      <h3>📋 Liste des utilisateurs</h3>
      <table>
        <thead>
          <tr>
            <th>Nom</th><th>Email</th><th>Téléphone</th><th>Service</th><th>Rôle</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.username}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.phone}</td>
              <td>{u.service}</td>
              <td>{u.role}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(u)}>✏️</button>
                <button className="delete-btn" onClick={() => handleDelete(u.username)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
