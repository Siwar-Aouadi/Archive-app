import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './access.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function MyAccessRequests({ token }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/access/my-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setRequests(res.data));
  }, [token]);

  return (
    <div className="access-card">
      <h3>📥 Mes demandes d'accès</h3>
      {requests.length === 0 && <p>Aucune demande envoyée.</p>}
      {requests.map(req => (
        <div className="request-item" key={req._id}>
          <strong>{req.title}</strong>
          <p>
            Statut: <span className={`status-${req.status}`}>{req.status}</span>
          </p>
          {req.status === 'accepted' && (
            <a
              className="download-link"
              href={`${API_BASE_URL}/download_by_id/${req.file_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📥 Télécharger le fichier
            </a>
          )}
          {req.status === 'rejected' && (
            <p className="status-rejected">Demande refusée.</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyAccessRequests;
