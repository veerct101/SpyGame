const Game = require('../models/Game');
const { startGame } = require('../services/gameEngine');

// Create a new game summary
const createGame = async (req, res) => {
  try {
    const game = new Game({ admin: req.user.id });
    await game.save();
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add players to a game before it starts
const addPlayers = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerIds } = req.body; // Array of User ObjectIds
    
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: 'Game not found' });
    if (game.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Only admin can modify this game' });
    if (game.status !== 'Lobby') return res.status(400).json({ message: 'Cannot add players after game has started' });
    
    // Using a simplistic approach to keep only unique players without adding them multiple times
    // (Assuming frontend ensures validity of IDs for simplicity in this scope)
    res.json({ message: 'Use PUT /start with all player IDs to lock them in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Start game
const startGameSession = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerIds, word1, word2, spyCount } = req.body;
    
    // Core game engine logic
    const game = await startGame(gameId, req.user.id, playerIds, word1, word2, spyCount);
    res.json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Securely fetch player's assigned word
const getAssignedWord = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    
    if (!game || game.status !== 'InProgress') {
      return res.status(400).json({ message: 'Game is not active' });
    }

    const playerRecord = game.players.find(p => {
      const pid = p.user._id ? p.user._id.toString() : p.user.toString();
      return pid === req.user.id;
    });
    
    if (!playerRecord) {
      return res.status(403).json({ message: 'You are not a player in this game' });
    }
    
    // CRITICAL: DO NOT REVEAL ROLE IN API RESPONSE
    res.json({ 
      word: playerRecord.assignedWord,
      isAlive: playerRecord.isAlive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Public status route
const getGameStatus = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId).populate('players.user', 'username name').populate('history.eliminatedPlayer', 'username name');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    
    // We only send back public status. We DO NOT expose words or roles unless in history.
    const publicState = {
      id: game._id,
      status: game.status,
      currentRound: game.currentRound,
      winner: game.winner,
      history: game.history,
      players: game.players.map(p => ({
        user: p.user._id ? p.user._id.toString() : p.user.toString(),
        username: p.user.username,
        name: p.user.name,
        isAlive: p.isAlive,
        points: p.points
      }))
    };
    
    res.json(publicState);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminGameStatus = async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId).populate('players.user', 'username name');
    if (!game) return res.status(404).json({ message: 'Game not found' });
    if (game.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Only admin can view this' });
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createGame, addPlayers, startGameSession, getAssignedWord, getGameStatus, getAdminGameStatus };
