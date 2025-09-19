const express = require('express');
const router = express.Router();
const {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityWithStats
} = require('../controllers/communityController');

// GET /api/communities - Get all communities
router.get('/', getAllCommunities);

// GET /api/communities/5 - Get community with ID 5
router.get('/:id', getCommunityById);

// GET /api/communities/5/stats - Get community with stats
router.get('/:id/stats', getCommunityWithStats);

// POST /api/communities - Create new community
router.post('/', createCommunity);

// PUT /api/communities/5 - Update community with ID 5
router.put('/:id', updateCommunity);

// DELETE /api/communities/5 - Delete community with ID 5
router.delete('/:id', deleteCommunity);

module.exports = router;