import React, { useState } from 'react';
import { Card, Typography, Box, TextField, Button } from '@mui/material';

const DiscordIntegration = () => {
  const [username, setUsername] = useState('');

  const handleSendInvite = async () => {
    try {
      // TODO: Implement Discord webhook integration
      console.log('Sending invite to:', username);
    } catch (error) {
      console.error('Error sending invite:', error);
    }
  };

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
          Discord Integration
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Discord Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(0, 255, 159, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 255, 159, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSendInvite}
          disabled={!username}
        >
          Send Discord Invite
        </Button>
      </Card>
    </Box>
  );
};

export default DiscordIntegration;
