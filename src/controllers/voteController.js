const Vote = require('../models/Vote');
const Game = require('../models/Game');
const { tallyVotes } = require('../services/gameEngine');

const submitVote = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { targetId } = req.body;
    const voterId = req.user.id;

    const game = await Game.findById(gameId);
    if (!game || game.status !== 'InProgress') {
      return res.status(400).json({ message: 'Game is not active' });
    }

    // Ensure voter is alive
    const voterRecord = game.players.find(p => {
      const pid = p.user._id ? p.user._id.toString() : p.user.toString();
      return pid === voterId;
    });
    if (!voterRecord || !voterRecord.isAlive) {
      return res.status(403).json({ message: 'Only alive players can vote' });
    }
    
    // Save vote
    const vote = new Vote({
      game: gameId,
      round: game.currentRound,
      voter: voterId,
      target: targetId
    });

    await vote.save();
    res.status(201).json({ message: 'Vote submitted successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'You have already voted in this round' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};

const triggerTally = async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game || game.status !== 'InProgress') {
      return res.status(400).json({ message: 'Game is not active' });
    }

    // Typically admin or system triggers tally
    if (game.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin can trigger vote tally' });
    }

    const updatedGame = await tallyVotes(gameId, game.currentRound);
    res.json(updatedGame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitVote, triggerTally };
