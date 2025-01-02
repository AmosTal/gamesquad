import React, { useState, useEffect } from 'react';
import { Card, Typography, Box, CircularProgress } from '@mui/material';
import { io } from 'socket.io-client';

const ServerStatus = ({ username }) => {
  const [serverStatus, setServerStatus] = useState('offline');
  const [onlineFriends, setOnlineFriends] = useState([]);
  
  useEffect(() => {
    if (!username) return;

    const socket = io('http://localhost:5002');
    
    // Emit join event with username when connected
    socket.on('connect', () => {
      socket.emit('join', username);
    });

    socket.on('serverConnected', () => {
      setServerStatus('online');
    });

    socket.on('friendsUpdate', (friends) => {
      setOnlineFriends(friends);
    });

    return () => socket.disconnect();
  }, [username]);

  if (!username) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card
        sx={{
          p: 3,
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 159, 0.2)',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
          Server Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CircularProgress
            size={20}
            sx={{
              color: serverStatus === 'online' ? '#00ff9f' : '#ff0000',
              mr: 2,
            }}
          />
          <Typography>
            Status: {serverStatus.toUpperCase()}
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Online Friends
        </Typography>
        {onlineFriends.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No friends online
          </Typography>
        ) : (
          onlineFriends.map((friend, index) => (
            <Typography key={index} variant="body2">
              {friend}
            </Typography>
          ))
        )}
      </Card>
    </Box>
  );
};

export default ServerStatus;
