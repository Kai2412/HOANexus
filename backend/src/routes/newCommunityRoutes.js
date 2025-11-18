const express = require('express');
const router = express.Router();
const {
  getNewCommunities,
  getNewCommunityById
} = require('../controllers/newCommunityController');

router.get('/', getNewCommunities);
router.get('/:id', getNewCommunityById);

module.exports = router;

