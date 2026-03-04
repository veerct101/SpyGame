import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, voteAPI } from '../services/api';

const VotingPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    gameAPI.getStatus(gameId)
      .then(res => setPlayers(res.data.players || []))
      .catch(err => setError('Failed to load players'));
  }, [gameId]);

  const handleVote = async () => {
    if (!selectedTarget) return setError('Please select a player to vote out');
    try {
      await voteAPI.submit(gameId, selectedTarget);
      setSuccess('Vote submitted! Awaiting tally...');
      setTimeout(() => navigate(`/game/${gameId}/result`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Vote failed');
    }
  };

  const alivePlayers = players.filter(p => p.isAlive);
  const myId = sessionStorage.getItem('userId');

  return (
    <div className="card vote-card">
      <h2>Submit Your Vote</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="players-grid">
        {alivePlayers.map(p => {
          const uId = typeof p.user === 'object' ? p.user._id : p.user;
          const displayName = p.name || (typeof p.username === 'object' ? p.username.username : (p.username || uId));
          return (
            <div 
              key={uId} 
              className={`player-select ${selectedTarget === uId ? 'selected' : ''}`}
              onClick={() => setSelectedTarget(uId)}
            >
              {displayName}
            </div>
          );
        })}
      </div>

      <button onClick={handleVote} className="btn-alert" disabled={!selectedTarget || !!success}>
        Submit Vote
      </button>
      
      <button onClick={() => navigate(`/game/${gameId}`)} className="btn-secondary" style={{marginTop:'10px'}}>
        Cancel
      </button>
    </div>
  );
};

export default VotingPage;
