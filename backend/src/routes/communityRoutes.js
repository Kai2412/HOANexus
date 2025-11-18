const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllCommunities, getCommunityById, createCommunity, updateCommunity } = require('../controllers/communityController');

router.get('/', getAllCommunities);
router.get('/:id', getCommunityById);
router.post('/', authenticateToken, createCommunity);
router.put('/:id', authenticateToken, updateCommunity);

module.exports = router;