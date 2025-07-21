import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './access.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function ReceivedAccessRequests({ token }) {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/access/received-requests`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRequests(res.data);
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const respond = async (id, decision) => {
    await axios.post(`${API_BASE_URL}/api/access/respond-request/${id}`, { decision }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchRequests();
  };

  return (
    <div className="access-card">
      <h3>📨 Demandes reçues</h3>
      {requests.length === 0 && <p>Aucune demande en attente.</p>}
      {requests.map(req => (
        <div className="request-item" key={req._id}>
          <strong>{req.title}</strong>
          <p>Statut: <span className={`status-${req.status}`}>{req.status}</span></p>
          {req.status === 'pending' && (
            <div className="response-buttons">
              <button className="accept" onClick={() => respond(req._id, 'accepted')}>✅ Accepter</button>
              <button className="reject" onClick={() => respond(req._id, 'rejected')}>❌ Refuser</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ReceivedAccessRequests;
