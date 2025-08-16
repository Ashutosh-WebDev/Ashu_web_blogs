import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Avatar,
  Divider,
  Fade
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Blog } from '../types';

// Using Blog interface from types.ts

interface BlogDetailProps {
  blog: Blog;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const BlogDetail: React.FC<BlogDetailProps> = ({ blog, open, onClose, onEdit, onDelete }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  const authorName = blog.author?.name || 'Unknown Author';

  // Get Google Docs embed URL
  const getGoogleDocsEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      // Try to extract document ID from various Google Docs URL formats
      let docId = '';
      
      // Format 1: https://docs.google.com/document/d/DOC_ID/edit
      let match = url.match(/\/d\/([\w-]+)/);
      if (match && match[1]) {
        docId = match[1];
      } else {
        // Format 2: https://docs.google.com/document/u/0/d/DOC_ID/edit
        match = url.match(/\/d\/([\w-]+)\/edit/);
        if (match && match[1]) {
          docId = match[1];
        } else {
          // Format 3: Just the ID itself
          match = url.match(/[\w-]{25,}/);
          if (match && match[0]) {
            docId = match[0];
          }
        }
      }
      
      if (docId) {
        // Parameters to make the document more readable
        const params = new URLSearchParams({
          rm: 'minimal',           // Remove most of the UI
          embedded: 'true',        // Make it embeddable
          single: 'true',          // Single page view
          widget: 'false',         // Hide widgets
          headers: 'false',        // Hide headers
          chrome: 'false',         // Hide chrome
          view: 'fit',             // Fit to width
          hd: 'false',             // No header
          hc: 'false',             // No chrome
          fsc: 'true',             // Full-screen content
          pli: '1',                // Show page numbers
          wf: 'true'               // Web fonts
        });
        
        return `https://docs.google.com/document/d/${docId}/preview?${params.toString()}`;
      }
      
      return url;
    } catch (e) {
      console.error('Error parsing Google Docs URL:', e);
      return url;
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.style.opacity = '1';
      iframe.style.transition = 'opacity 0.3s ease-in-out';
    }
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '95vh',
          maxHeight: 'none',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: theme.palette.background.default,
          boxShadow: theme.shadows[10],
          '& .MuiDialog-container': {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: fullScreen ? 0 : 2,
            display: 'flex',
            flexDirection: 'column',
          },
          [theme.breakpoints.up('md')]: {
            height: '90vh',
            maxHeight: '1200px',
          }
        },
      }}
      transitionDuration={300}
      TransitionComponent={Fade}
    >
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: theme.palette.primary.contrastText,
        py: 2,
        px: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: theme.shadows[2],
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
        }
      }}>
        {blog.title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
            transition: 'all 0.2s ease',
            transform: 'scale(0.9)'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ 
        p: 0, 
        display: 'flex', 
        flexDirection: 'column',
        flex: 1,
        backgroundColor: theme.palette.background.default,
        overflow: 'hidden',
        '&.MuiDialogContent-root': {
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {/* Blog Header */}
        <Box sx={{ 
          p: 3, 
          pb: 2,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="h4" component="h1" sx={{ 
            fontWeight: 700,
            mb: 2,
            lineHeight: 1.3,
            color: theme.palette.text.primary,
          }}>
            {blog.title}
          </Typography>
          
          {/* Author and Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar sx={{ 
              width: 32, 
              height: 32, 
              mr: 1.5,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {authorName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                {authorName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: theme.palette.text.secondary }}>
                <CalendarIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                <Typography variant="caption">
                  Posted on {formatDate(blog.createdAt)}
                  {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
                    <>
                      <UpdateIcon sx={{ fontSize: '0.8rem', ml: 1, mr: 0.5, verticalAlign: 'middle' }} />
                      Updated {formatDate(blog.updatedAt)}
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ mt: 2, mb: 1 }} />
        </Box>

        {/* Blog Content */}
        <Box sx={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
          p: 0,
          m: 0,
          '& iframe': {
            border: 'none',
            width: '100%',
            height: '100%',
            minHeight: 'calc(100vh - 250px)',
            backgroundColor: theme.palette.background.paper,
            overflow: 'auto',
            '&.MuiBox-root': {
              borderRadius: 0,
              p: 0,
              m: 0,
            },
            '& body': {
              backgroundColor: 'transparent !important',
              padding: '40px 0 !important',
              '& .kix-page-paginated': {
                boxShadow: 'none !important',
                backgroundColor: 'transparent !important',
              },
              '& .kix-page': {
                backgroundColor: 'transparent !important',
                boxShadow: 'none !important',
              },
              '& .kix-page-content': {
                padding: '60px 80px !important',
                maxWidth: '1000px',
                margin: '0 auto !important',
                backgroundColor: `${theme.palette.background.paper} !important`,
                boxShadow: 'none !important',
                '& p, & div, & span, & li, & a': {
                  fontFamily: `${theme.typography.fontFamily} !important`,
                  lineHeight: '1.8 !important',
                  fontSize: '1.1rem !important',
                  color: `${theme.palette.text.primary} !important`,
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  fontFamily: `${theme.typography.fontFamily} !important`,
                  color: `${theme.palette.text.primary} !important`,
                  margin: '1.5em 0 0.8em 0 !important',
                },
                '& p': {
                  marginBottom: '1.8em !important',
                },
                '& ul, & ol': {
                  margin: '1.5em 0 !important',
                  paddingLeft: '2em !important',
                  '& li': {
                    marginBottom: '0.8em !important',
                  }
                }
              }
            }
          }
        }}>
          <Box
            component="iframe"
            src={getGoogleDocsEmbedUrl(blog.googleDriveLink)}
            title={blog.title}
            width="100%"
            height="100%"
            frameBorder="0"
            onLoad={handleIframeLoad}
            sx={{
              flex: 1,
              minHeight: 'calc(100vh - 250px)',
              opacity: loading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
              border: 'none',
              backgroundColor: theme.palette.background.paper,
              visibility: loading ? 'hidden' : 'visible',
              position: 'relative',
              zIndex: 1,
              '&::-webkit-scrollbar': {
                display: 'none',
              },
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
            allowFullScreen
          />
          {loading && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.palette.background.paper,
              zIndex: 0
            }}>
              <Typography>Loading document...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: 3, 
        py: 2, 
        borderTop: `1px solid ${theme.palette.divider}`,
        justifyContent: 'space-between',
        backgroundColor: theme.palette.background.paper,
        '&.MuiDialogActions-root': {
          padding: theme.spacing(2, 3),
        }
      }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {onEdit && (
            <Button 
              onClick={onEdit} 
              variant="outlined"
              color="primary"
              size="medium"
              startIcon={<EditIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.8,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.primary.light + '10',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Edit Post
            </Button>
          )}
          {onDelete && (
            <Button 
              onClick={onDelete} 
              variant="outlined"
              color="error"
              size="medium"
              startIcon={<DeleteIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.8,
                fontWeight: 500,
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.error.light + '10',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Delete
            </Button>
          )}
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<OpenInNewIcon />}
          href={blog.googleDriveLink} 
          target="_blank"
          rel="noopener noreferrer"
          size="medium"
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            px: 2.5,
            py: 0.9,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }
          }}
        >
          Open in Google Docs
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlogDetail;
