import React, { useState, useEffect } from 'react';
import { Card, Typography, Box, CircularProgress, Button } from '@mui/material';
import { io } from 'socket.io-client';

const ServerStatus = () => {
  const [serverStatus, setServerStatus] = useState('offline');
  const [onlineFriends, setOnlineFriends] = useState([]);
  
  useEffect(() => {
    const socket = io('http://localhost:5002');
    
    socket.on('serverConnected', () => {
      setServerStatus('online');
    });

    socket.on('friendsUpdate', (friends) => {
      setOnlineFriends(friends);
    });

    return () => socket.disconnect();
  }, []);

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

        <Typography variant="h6" sx={{ mb: 2 }}>
          Online Friends
        </Typography>
        
        {onlineFriends.length === 0 ? (
          <Typography color="text.secondary">
            No friends online
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {onlineFriends.map((friend) => (
              <Card
                key={friend.id}
                sx={{
                  p: 2,
                  background: 'rgba(26, 26, 26, 0.5)',
                }}
              >
                <Typography>{friend.name}</Typography>
              </Card>
            ))}
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          onClick={() => {/* TODO: Implement join server */}}
        >
          Join Server
        </Button>
      </Card>
    </Box>
  );
};

export default ServerStatus;
