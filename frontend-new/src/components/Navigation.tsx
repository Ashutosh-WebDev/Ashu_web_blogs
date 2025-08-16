import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Typography, Box, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Don't show navigation on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <AppBar position="static" elevation={0} sx={{ mb: 4, backgroundColor: 'white', color: 'text.primary', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            Blog
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>
                <Button
                  component={RouterLink}
                  to="/dashboard"
                  color="inherit"
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                >
                  Dashboard
                </Button>
                <Button
                  onClick={logout}
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
                size="small"
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navigation;
