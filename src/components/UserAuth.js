import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Avatar 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

const UserAuth = ({ onUserLogin }) => {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const storedUsername = localStorage.getItem('gameSquadUsername');
    if (storedUsername) {
      onUserLogin(storedUsername);
    } else {
      setOpen(true);
    }
  }, [onUserLogin]);

  const handleLogin = () => {
    if (username.trim()) {
      localStorage.setItem('gameSquadUsername', username);
      onUserLogin(username);
      setOpen(false);
    }
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'rgba(26, 26, 26, 0.9)',
    border: '2px solid rgba(0, 255, 159, 0.2)',
    boxShadow: 24,
    p: 4,
    textAlign: 'center',
    borderRadius: 2
  };

  return (
    <Modal
      open={open}
      aria-labelledby="login-modal-title"
      aria-describedby="login-modal-description"
    >
      <Box sx={modalStyle}>
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            margin: '0 auto 20px',
            bgcolor: 'primary.main' 
          }}
        >
          <PersonIcon sx={{ fontSize: 50 }} />
        </Avatar>
        <Typography 
          id="login-modal-title" 
          variant="h5" 
          component="h2" 
          color="primary"
          sx={{ mb: 2 }}
        >
          Welcome to GameSquad
        </Typography>
        <TextField
          fullWidth
          label="Enter Your Nickname"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{
            mb: 3,
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
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleLogin}
          disabled={!username.trim()}
        >
          Join GameSquad
        </Button>
      </Box>
    </Modal>
  );
};

export default UserAuth;
