import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const PlayerJoinPage = () => {
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!playerId || !playerName || !gameId) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    
    try {
      try {
        await authAPI.register({ username: playerId, name: playerName, password: 'password', role: 'Player' });
      } catch (err) {}
      
      const userRes = await authAPI.login({ username: playerId, password: 'password' });
      sessionStorage.setItem('token', userRes.data.token);
      sessionStorage.setItem('userId', userRes.data.user.id);
      sessionStorage.setItem('username', userRes.data.user.username);
      sessionStorage.setItem('name', userRes.data.user.name);
      
      navigate(`/game/${gameId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate');
    }
  };

  return (
    <div className="card join-card">
      <h2>Join Game</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleJoin}>
        <div className="form-group">
          <label>Player ID (Login ID):</label>
          <input 
            type="text" 
            value={playerId} 
            onChange={e => setPlayerId(e.target.value)} 
            placeholder="E.g. player1"
          />
        </div>
        <div className="form-group">
          <label>Display Name:</label>
          <input 
            type="text" 
            value={playerName} 
            onChange={e => setPlayerName(e.target.value)} 
            placeholder="E.g. Rahul"
          />
        </div>
        <div className="form-group">
          <label>Game ID:</label>
          <input 
            type="text" 
            value={gameId} 
            onChange={e => setGameId(e.target.value)} 
            placeholder="Enter Game ID"
          />
        </div>
        <button type="submit" className="btn-primary">Join Game</button>
      </form>
      
      <div className="admin-link" style={{marginTop:'1.5rem', textAlign:'center'}}>
        <a onClick={() => navigate('/admin')} style={{cursor: 'pointer', color: '#10b981', textDecoration: 'underline'}}>Go to Admin Dashboard</a>
      </div>
    </div>
  );
};

export default PlayerJoinPage;
