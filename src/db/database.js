const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Create SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../gamesquad.sqlite'),
  logging: false
});

// Define Video History Model
const VideoHistory = sequelize.define('VideoHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  addedBy: {
    type: DataTypes.STRING,
    defaultValue: 'Anonymous'
  },
  addedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Sync database (create tables if not exist)
const initializeDatabase = async () => {
  try {
    await sequelize.sync();
    console.log('Database and tables created successfully');
  } catch (error) {
    console.error('Unable to create database:', error);
  }
};

// Database methods
const addVideoToHistory = async (videoData) => {
  try {
    const video = await VideoHistory.create(videoData);
    return video;
  } catch (error) {
    console.error('Error adding video to history:', error);
    return null;
  }
};

const getVideoHistory = async (limit = 10) => {
  try {
    const videos = await VideoHistory.findAll({
      order: [['addedAt', 'DESC']],
      limit: limit
    });
    return videos;
  } catch (error) {
    console.error('Error retrieving video history:', error);
    return [];
  }
};

const deleteOldVideos = async (daysOld = 30) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - daysOld);
    
    const result = await VideoHistory.destroy({
      where: {
        addedAt: {
          [Sequelize.Op.lt]: thirtyDaysAgo
        }
      }
    });
    
    console.log(`Deleted ${result} old videos`);
    return result;
  } catch (error) {
    console.error('Error deleting old videos:', error);
    return 0;
  }
};

module.exports = {
  initializeDatabase,
  addVideoToHistory,
  getVideoHistory,
  deleteOldVideos,
  VideoHistory
};
