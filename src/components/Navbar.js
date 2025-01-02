import React from 'react';
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static" sx={{ background: 'rgba(26, 26, 26, 0.8)', backdropFilter: 'blur(10px)' }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'primary.main',
            fontWeight: 'bold',
            letterSpacing: '0.1em',
            '&:hover': {
              textShadow: '0 0 10px #00ff9f',
            },
          }}
        >
          GAMESQUAD
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={Link}
            to="/"
            color="inherit"
            sx={{
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            Server Status
          </Button>
          <Button
            component={Link}
            to="/discord"
            color="inherit"
            sx={{
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            Discord
          </Button>
          <Button
            component={Link}
            to="/videos"
            color="inherit"
            sx={{
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            Videos
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
