import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI } from '../services/api';

const PlayerDashboard = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [wordData, setWordData] = useState(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const statusRes = await gameAPI.getStatus(gameId);
      setStatus(statusRes.data);
      try {
        const wordRes = await gameAPI.getWord(gameId);
        setWordData(wordRes.data);
      } catch (e) {
        setWordData({ word: '???' });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading dashboard');
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000); // Polling for simplicity
    return () => clearInterval(interval);
  }, [gameId]);

  if (error) return <div className="error">{error}</div>;
  if (!status) return <div>Loading...</div>;

  if (status.status === 'Finished') {
    return (
      <div className="card">
        <h2>Game Ended</h2>
        <button onClick={() => navigate(`/game/${gameId}/result`)} className="btn-primary">View Results</button>
      </div>
    );
  }

  const meUserId = sessionStorage.getItem('userId');
  const me = status.players?.find(p => p.user === meUserId) 
             || { points: 0, isAlive: false };

  return (
    <div className="card dashboard-card">
      <div className="dashboard-header" style={{display:'flex', justifyContent:'space-between', marginBottom:'1.5rem'}}>
        <h2>Round {status.currentRound}</h2>
        <div className="badge" style={{background:'var(--primary)', padding:'0.5rem 1rem', borderRadius:'20px'}}>{status.status}</div>
      </div>
      
      <div className="info-box shadow-box">
        <h3>Your Word</h3>
        <p className="secret-word">{wordData?.word || '???'}</p>
        {!me.isAlive && <div className="eliminated-badge">You are eliminated</div>}
      </div>

      <div className="info-box shadow-box">
        <h3>Your Points</h3>
        <p className="points-display">{me.points ?? '-'}</p>
      </div>

      <div className="players-list shadow-box">
        <h3>Alive Players</h3>
        <ul>
          {status.players?.filter(p => p.isAlive).map(p => {
            const displayId = typeof p.user === 'object' ? p.user._id : p.user;
            const displayName = p.name || (typeof p.username === 'object' ? p.username.username : (p.username || displayId));
            return <li key={displayId}>{displayName}</li>;
          })}
        </ul>
      </div>

      <button 
        className="btn-alert" 
        onClick={() => navigate(`/game/${gameId}/vote`)}
        disabled={!me.isAlive || status.status !== 'InProgress'}
      >
        Go to Voting
      </button>
    </div>
  );
};

export default PlayerDashboard;
