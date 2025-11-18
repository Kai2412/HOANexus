const NewCommunity = require('../models/newCommunity');
const { logger } = require('../utils/logger');

const getNewCommunities = async (req, res) => {
  try {
    const communities = await NewCommunity.getAll();
    res.status(200).json({
      success: true,
      message: 'New communities retrieved successfully',
      data: communities,
      count: communities.length
    });
  } catch (error) {
    logger.databaseError('fetch', 'new communities', error, 'NewCommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve new communities',
      error: error.message
    });
  }
};

const getNewCommunityById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Community ID is required'
    });
  }

  try {
    const community = await NewCommunity.getById(id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'New community retrieved successfully',
      data: community
    });
  } catch (error) {
    logger.databaseError('fetch', 'new community', error, 'NewCommunityController');
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve new community',
      error: error.message
    });
  }
};

module.exports = {
  getNewCommunities,
  getNewCommunityById
};

