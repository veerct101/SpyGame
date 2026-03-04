import React, { useState, useEffect } from 'react';
import { authAPI, gameAPI, voteAPI } from '../services/api';

const AdminDashboard = () => {
  const [adminName, setAdminName] = useState('AdminUser');
  const [adminPass, setAdminPass] = useState('adminpass');
  const [loggedIn, setLoggedIn] = useState(false);
  const [gameId, setGameId] = useState('');
  
  const [word1, setWord1] = useState('Dog');
  const [word2, setWord2] = useState('Cat');
  const [spyCount, setSpyCount] = useState(1);
  const [gameStatus, setGameStatus] = useState(null);

  const [users, setUsers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  const loadUsers = async () => {
    try {
       const res = await authAPI.getUsers();
       setUsers(res.data);
    } catch (err) { console.error('Failed to fetch users', err); }
  };

  useEffect(() => {
    if (loggedIn) loadUsers();
  }, [loggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      try { await authAPI.register({ username: adminName, password: adminPass, role: 'Admin' }); } catch(err){}
      const res = await authAPI.login({ username: adminName, password: adminPass });
      // Store admin token separately so player tabs don't overwrite it.
      localStorage.setItem('adminToken', res.data.token);
      setLoggedIn(true);
    } catch (err) {
      alert('Login failed');
    }
  };

  const handleCreate = async () => {
    try {
      const res = await gameAPI.create();
      setGameId(res.data._id);
      alert('Game creates! ID: ' + res.data._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Create failed');
    }
  };

  const toggleUser = (userId) => {
    setSelectedPlayerIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleStart = async () => {
    try {
      if (selectedPlayerIds.length < 3) return alert('Select at least 3 players');
      await gameAPI.start(gameId, { playerIds: selectedPlayerIds, word1, word2, spyCount: Number(spyCount) });
      alert('Started successfully');
      refreshStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Start failed');
    }
  };
  
  const refreshStatus = async () => {
    if(!gameId) return;
    try {
      const res = await gameAPI.getAdminStatus(gameId);
      setGameStatus(res.data);
    } catch(err){}
  };

  const handleTally = async () => {
    try {
      await voteAPI.triggerTally(gameId);
      alert('Tally executed!');
      refreshStatus();
    } catch(err){
      alert('Tally failed: ' + err.response?.data?.message);
    }
  };

  if (!loggedIn) {
    return (
      <div className="card">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input value={adminName} onChange={e=>setAdminName(e.target.value)} placeholder="Username" />
          </div>
          <button type="submit" className="btn-primary">Login Workspace</button>
        </form>
      </div>
    );
  }

  return (
    <div className="card admin-card" style={{ maxWidth: '600px'}}>
      <h2>Admin Control Panel</h2>
      
      {!gameId ? (
        <button onClick={handleCreate} className="btn-primary">Create New Game</button>
      ) : (
        <div className="admin-section shadow-box">
          <p><strong>Game ID:</strong> <span style={{color:'var(--primary)'}}>{gameId}</span></p>
          <hr style={{opacity:0.2, margin:'1rem 0'}}/>
          
          <div className="form-group">
            <label>Select Players (Minimum 3):</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding:'10px', borderRadius:'8px' }}>
               <button onClick={loadUsers} type="button" className="btn-secondary" style={{marginBottom: "10px", padding: '5px', fontSize:'0.8rem'}}>↻ Refresh User List</button>
               {users.filter(u => u.role !== 'Admin').map(u => (
                 <div key={u._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                   <input 
                     type="checkbox" 
                     id={u._id} 
                     checked={selectedPlayerIds.includes(u._id)}
                     onChange={() => toggleUser(u._id)} 
                     style={{ marginRight: '10px' }}
                   />
                   <label htmlFor={u._id} style={{ marginBottom: 0, cursor: 'pointer', lineHeight: '1.2' }}>{u.name ? `${u.name} (${u.username})` : u.username}</label>
                 </div>
               ))}
               {users.filter(u => u.role !== 'Admin').length === 0 && <p style={{ fontSize: '0.8rem', color: '#ccc' }}>No registered players found. Open another tab and join as players.</p>}
            </div>
          </div>

          <div className="form-group">
             <label>Citizen Word:</label>
             <input value={word1} onChange={e=>setWord1(e.target.value)} />
          </div>
          <div className="form-group">
             <label>Spy Word:</label>
             <input value={word2} onChange={e=>setWord2(e.target.value)} />
          </div>
          <div className="form-group">
             <label>Spy Count:</label>
             <input type="number" value={spyCount} onChange={e=>setSpyCount(e.target.value)} />
          </div>
          <button onClick={handleStart} className="btn-alert" disabled={selectedPlayerIds.length < 3}>START GAME</button>
        </div>
      )}

      {gameId && (
        <div className="admin-status" style={{marginTop: '20px'}}>
          <button onClick={refreshStatus} className="btn-secondary">Refresh Live Status</button>
          {gameStatus && (
            <div className="shadow-box status-view" style={{marginTop: '10px'}}>
               <p><strong>Status:</strong> {gameStatus.status}</p>
               <p><strong>Round:</strong> {gameStatus.currentRound}</p>
               
               <h3 style={{ marginTop: '1rem', borderBottom: '1px solid #3b82f6', display: 'inline-block', paddingBottom: '3px' }}>Players in Game (Admin View)</h3>
               <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                 {gameStatus.players?.map(p => (
                   <li key={p.user._id || p.user} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                     <div><strong>{p.user.name ? `${p.user.name} (${p.user.username})` : (p.user.username || p.user)}</strong> - <span style={{color: p.role === 'Spy' ? '#ef4444' : '#3b82f6'}}>{p.role}</span></div>
                     <div style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '3px' }}>Word: {p.assignedWord} | Status: {p.isAlive ? <span style={{color:'#10b981'}}>Alive</span> : <span style={{color:'#fca5a5'}}>Eliminated</span>} | Pts: {p.points}</div>
                   </li>
                 ))}
               </ul>

               {gameStatus.status === 'InProgress' && (
                 <button onClick={handleTally} className="btn-alert mt-2" style={{background:'#f59e0b'}}>Process Round Votes (End Round)</button>
               )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
