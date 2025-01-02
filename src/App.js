import React from 'react';
import { ThemeProvider, CssBaseline, createTheme, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ServerStatus from './components/ServerStatus';
import DiscordIntegration from './components/DiscordIntegration';
import VideoShare from './components/VideoShare';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff9f',
    },
    secondary: {
      main: '#ff00ff',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'uppercase',
          fontWeight: 'bold',
          '&:hover': {
            boxShadow: '0 0 10px #00ff9f',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            minHeight: '100vh',
            background: 'linear-gradient(45deg, #0a0a0a 0%, #1a1a1a 100%)',
          }}
        >
          <Navbar />
          <Box component="main" sx={{ p: 3 }}>
            <Routes>
              <Route path="/" element={<ServerStatus />} />
              <Route path="/discord" element={<DiscordIntegration />} />
              <Route path="/videos" element={<VideoShare />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
