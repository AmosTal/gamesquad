import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box 
} from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = ({ username }) => {
  const handleLogout = () => {
    localStorage.removeItem('gameSquadUsername');
    window.location.reload();
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'rgba(26, 26, 26, 0.8)', 
        backdropFilter: 'blur(10px)' 
      }}
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          GameSquad
        </Typography>

        {username && (
          <>
            <Typography 
              variant="body1" 
              sx={{ 
                mr: 2, 
                color: 'text.secondary' 
              }}
            >
              Welcome, {username}
            </Typography>
            <Button 
              color="secondary" 
              variant="outlined"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
