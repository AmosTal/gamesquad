import React, { useState } from 'react';
import { Card, Typography, Box, TextField, Button, Grid } from '@mui/material';

const VideoShare = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videos, setVideos] = useState([]);

  const handleAddVideo = () => {
    if (videoUrl) {
      // Extract video ID from YouTube URL
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      if (videoId) {
        setVideos([...videos, { id: videoId, url: videoUrl }]);
        setVideoUrl('');
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Card
        sx={{
          p: 3,
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 159, 0.2)',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
          Share YouTube Videos
        </Typography>

        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="YouTube Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddVideo}
            disabled={!videoUrl}
          >
            Add Video
          </Button>
        </Box>

        <Grid container spacing={3}>
          {videos.map((video) => (
            <Grid item xs={12} md={6} key={video.id}>
              <Card
                sx={{
                  background: 'rgba(26, 26, 26, 0.5)',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                  <iframe
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 0,
                    }}
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default VideoShare;
