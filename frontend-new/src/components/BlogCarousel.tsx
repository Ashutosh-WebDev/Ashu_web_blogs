import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardMedia,
  Typography,
  Button,
  IconButton,
  Chip,
  useTheme,
} from '@mui/material';
import { ChevronLeft, ChevronRight, ArrowForward, Delete as DeleteIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import { Blog } from '../types';
import { format } from 'date-fns';

interface BlogCarouselProps {
  blogs: Blog[];
  onView?: (blog: Blog) => void;
  isAuthenticated?: boolean;
}

const BlogCarousel: React.FC<BlogCarouselProps> = ({ blogs, onView, isAuthenticated = false }) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [openDetail, setOpenDetail] = useState<{ open: boolean; blog: Blog | null }>({ 
    open: false, 
    blog: null 
  });
  const [docError, setDocError] = useState(false);

  // Inline tiny transparent GIF as a guaranteed fallback
  const FALLBACK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  // Function to get document viewer URL
  const getDocumentViewerUrl = (url: string): string => {
    try {
      // Extract file ID from URL
      const fileIdMatch = url.match(/[\w-]{25,}/);
      const fileId = fileIdMatch ? fileIdMatch[0] : '';
      
      if (!fileId) return url; // Return original URL if no file ID found
      
      // Return Google Drive viewer URL with file ID
      return `https://drive.google.com/file/d/${fileId}/preview`;
    } catch (error) {
      console.error('Error generating document viewer URL:', error);
      return url; // Fallback to original URL if there's an error
    }
  };

  // Auto-advance carousel
  useEffect(() => {
    if (blogs.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % blogs.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [blogs.length, isPaused]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % blogs.length);
  }, [blogs.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + blogs.length) % blogs.length);
  }, [blogs.length]);

  const handleOpenDetail = useCallback((blog: Blog) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(blog);
    }
    setOpenDetail({ open: true, blog });
  }, [onView]);

  const handleCloseDetail = useCallback(() => {
    setOpenDetail({ open: false, blog: null });
  }, []);

  if (blogs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1">No blog posts available</Typography>
      </Box>
    );
  }

  const currentBlog = blogs[currentIndex];
  const hasMultipleItems = blogs.length > 1;
  const imageUrl = (() => {
    if (!currentBlog.image) return '';
    if (typeof currentBlog.image === 'string') {
      const src = currentBlog.image;
      // Avoid mixed-content in production
      return src.startsWith('http://') ? src.replace(/^http:\/\//, 'https://') : src;
    }
    if ('data' in currentBlog.image) {
      const dataUrl = `data:${currentBlog.image.contentType || 'image/jpeg'};base64,${currentBlog.image.data}`;
      try {
        const byteLength = typeof currentBlog.image.data === 'string' ? currentBlog.image.data.length : 0;
        console.log('[BlogCarousel] MongoDB image detected and prepared', {
          title: currentBlog.title,
          contentType: currentBlog.image.contentType || 'image/jpeg',
          base64Length: byteLength,
        });
      } catch {}
      return dataUrl;
    }
    return '';
  })();

  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '1400px',
        mx: 'auto',
        '&:hover .carousel-arrow': {
          opacity: 1,
        },
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Navigation Arrows */}
      {hasMultipleItems && (
        <>
          <IconButton
            className="carousel-arrow"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              opacity: 0.7,
              transition: 'opacity 0.3s',
              zIndex: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                opacity: 1,
              },
            }}
          >
            <ChevronLeft fontSize="large" />
          </IconButton>
          <IconButton
            className="carousel-arrow"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              opacity: 0.7,
              transition: 'opacity 0.3s',
              zIndex: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                opacity: 1,
              },
            }}
          >
            <ChevronRight fontSize="large" />
          </IconButton>
        </>
      )}

      {/* Carousel Item */}
      <Box sx={{ position: 'relative', width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <Card sx={{ boxShadow: 'none', borderRadius: 0 }}>
          <Box sx={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
            <CardMedia
              component="img"
              image={imageUrl || FALLBACK_IMG}
              alt={currentBlog.title}
              loading="eager"
              decoding="sync"
              onLoad={(e: any) => {
                const src: string = e?.currentTarget?.currentSrc || '';
                console.log('[BlogCarousel] Image rendered', { title: currentBlog.title, src: src.slice(0, 64) + (src.length > 64 ? '…' : '') });
              }}
              onError={(e: any) => { e.currentTarget.src = FALLBACK_IMG; }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)',
                color: 'white',
                p: 3,
              }}
            >
              <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
                {currentBlog.title}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenDetail(currentBlog)}
                endIcon={<ArrowForward />}
                sx={{
                  marginTop: 1,
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { 
                    backgroundColor: theme.palette.primary.dark 
                  },
                }}
              >
                Read More
              </Button>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Dots Indicator */}
      {hasMultipleItems && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
          {blogs.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: currentIndex === index ? 'primary.main' : 'action.disabled',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            />
          ))}
        </Box>
      )}

      {/* Blog Detail Modal - Matching BlogCard's implementation */}
      {openDetail.open && openDetail.blog && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            p: 2,
            overflow: 'hidden',
            '& body': {
              overflow: 'hidden !important'
            }
          }}
          onClick={handleCloseDetail}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              maxWidth: '90%',
              width: '1200px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              '& .MuiBox-root': {
                maxWidth: '100%',
                padding: 3,
              },
              '& iframe': {
                width: '100%',
                minHeight: '500px',
                border: 'none',
                flexGrow: 1
              },
              '& .MuiTypography-h4': {
                fontSize: '2rem',
                marginBottom: '1.5rem',
              },
            }}
          >
            <IconButton
              onClick={handleCloseDetail}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 1,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.2)',
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
            
            <Box sx={{ 
              p: 4, 
              overflowY: 'auto',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: theme.palette.grey[100],
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.grey[400],
                borderRadius: '4px',
                '&:hover': {
                  background: theme.palette.grey[500],
                },
              },
            }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {openDetail.blog.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                {openDetail.blog.author && (
                  <Chip 
                    label={`By ${openDetail.blog.author.name || 'Unknown Author'}`}
                    size="small"
                    sx={{ 
                      backgroundColor: theme.palette.primary.light,
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" color="textSecondary">
                    {openDetail.blog.createdAt && 
                      format(new Date(openDetail.blog.createdAt), 'MMMM d, yyyy')}
                    {openDetail.blog.updatedAt && openDetail.blog.updatedAt !== openDetail.blog.createdAt && (
                      <span> • Updated {format(new Date(openDetail.blog.updatedAt), 'MMMM d, yyyy')}</span>
                    )}
                  </Typography>
                </Box>
              </Box>
              
              {imageUrl && (
                <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                  <img 
                    src={imageUrl || FALLBACK_IMG}
                    alt={openDetail.blog.title}
                    loading="eager"
                    decoding="sync"
                    onLoad={(e: any) => {
                      const src: string = e?.currentTarget?.currentSrc || '';
                      console.log('[BlogCarousel Modal] Image rendered', { title: openDetail.blog?.title, src: src.slice(0, 64) + (src.length > 64 ? '…' : '') });
                    }}
                    onError={(e: any) => { e.currentTarget.src = FALLBACK_IMG; }}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </Box>
              )}
              
              {/* Document Viewer - Show to all users */}
              {openDetail.blog.googleDriveLink && (
                <Box sx={{ width: '100%', height: '70vh', mt: 2, position: 'relative' }}>
                  <Box sx={{ 
                    width: '100%', 
                    height: '100%',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <iframe
                      src={getDocumentViewerUrl(openDetail.blog.googleDriveLink)}
                      width="100%"
                      height="100%"
                      style={{ 
                        border: 'none',
                        flexGrow: 1,
                        minHeight: 0 // Allows iframe to shrink below its content size
                      }}
                      title="Document Viewer"
                      allow="autoplay"
                      onError={() => setDocError(true)}
                    />
                    <Box sx={{ 
                      width: '100%', 
                      p: 2, 
                      bgcolor: 'background.paper',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 2
                    }}>
                      <Button 
                        variant="outlined" 
                        href={openDetail.blog.googleDriveLink}
                        target="_blank"
                        startIcon={<OpenInNewIcon />}
                      >
                        Open in New Tab
                      </Button>
                    </Box>
                  </Box>
                  {docError && (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      textAlign: 'center',
                      bgcolor: 'background.paper'
                    }}>
                      <Typography color="error" gutterBottom>
                        Could not load the document. Please try opening it in a new tab.
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        href={openDetail.blog.googleDriveLink}
                        target="_blank"
                        sx={{ mt: 2 }}
                      >
                        Open in New Tab
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Show blog content if no document */}
              {!openDetail.blog.googleDriveLink && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body1" paragraph>
                    {openDetail.blog.title ? `Viewing: ${openDetail.blog.title}` : 'No additional content available.'}
                  </Typography>
                </Box>
              )}

              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'flex-end',
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 3,
                mt: 'auto'
              }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCloseDetail}
                >
                  Close
                </Button>
                {openDetail.blog.googleDriveLink && (
                  <Button 
                    variant="contained" 
                    color="primary"
                    href={openDetail.blog.googleDriveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<OpenInNewIcon />}
                  >
                    Open in Google Drive
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BlogCarousel;
