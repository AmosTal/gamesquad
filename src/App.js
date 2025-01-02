import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import ServerStatus from './components/ServerStatus';
import DiscordIntegration from './components/DiscordIntegration';
import UserAuth from './components/UserAuth';
import VideoShare from './components/VideoShare';

// Create a dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ff9f', // Neon green
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});

function App() {
  const [username, setUsername] = useState(null);

  const handleUserLogin = (newUsername) => {
    setUsername(newUsername);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        
        {!username && <UserAuth onUserLogin={handleUserLogin} />}
        
        <Router>
          <Box
            sx={{
              minHeight: '100vh',
              background: 'linear-gradient(45deg, #0a0a0a 0%, #1a1a1a 100%)',
            }}
          >
            <Navbar username={username} />
            <Box component="main" sx={{ p: 3 }}>
              <Routes>
                <Route path="/" element={<ServerStatus username={username} />} />
                <Route path="/discord" element={<DiscordIntegration username={username} />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
