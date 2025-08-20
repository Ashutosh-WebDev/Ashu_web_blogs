import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  useTheme,
  Box,
  IconButton,
  Tooltip,
  CardMedia,
  Chip
} from '@mui/material';
// import { useAuth } from '../contexts/AuthContext';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Update as UpdateIcon,
  ArrowForward as ArrowForwardIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { Blog } from '../types';
import { Link as RouterLink } from 'react-router-dom';

interface BlogCardProps {
  blog: Blog;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showContent?: boolean;
  sx?: any; // Allow sx prop for custom styling
}

// Function to get document viewer URL
const getDocumentViewerUrl = (url: string): string => {
  try {
    const fileIdMatch = url.match(/[\w-]{25,}/);
    const fileId = fileIdMatch ? fileIdMatch[0] : '';
    if (!fileId) return url;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } catch (error) {
    console.error('Error generating document viewer URL:', error);
    return url;
  }
};

const BlogCard: React.FC<BlogCardProps> = ({
  blog,
  onView,
  onEdit,
  onDelete,
  showContent = true,
  sx = {}
}) => {
  const [openDetail, setOpenDetail] = useState(false);
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageError, setImageError] = useState(false);
  const [docError, setDocError] = useState(false);

  // Inline tiny transparent GIF as a guaranteed fallback (invisible)
  const FALLBACK_IMG =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  // Handle image source extraction
  useEffect(() => {
    if (!blog.image) {
      setImageSrc('');
      return;
    }

    if (typeof blog.image === 'string') {
      const src = blog.image;
      // Avoid mixed-content in production
      const normalized = src.startsWith('http://')
        ? src.replace(/^http:\/\//, 'https://')
        : src;
      setImageSrc(normalized);
    } else if ('data' in blog.image) {
      const dataUrl = `data:${blog.image.contentType || 'image/jpeg'};base64,${blog.image.data}`;
      setImageSrc(dataUrl);
      // Log detection of MongoDB image payload
      try {
        const byteLength =
          typeof blog.image.data === 'string' ? blog.image.data.length : 0;
        console.log('[BlogCard] MongoDB image detected and prepared', {
          title: blog.title,
          contentType: blog.image.contentType || 'image/jpeg',
          base64Length: byteLength
        });
      } catch {
        // no-op
      }
    }
  }, [blog.image, blog.title]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const handleDeleteClick = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this blog post?'
    );
    if (!confirmed) return;

    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenDetail(true);
    if (onView) onView();
  };

  return (
    <>
      <Card
        sx={{
          width: '100%',
          height: '100%',
          minHeight: '350px',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            borderColor: theme.palette.primary.main
          },
          position: 'relative',
          overflow: 'hidden',
          ...sx
        }}
      >
        {/* Image Section */}
        <Box sx={{ position: 'relative', height: '200px', flexShrink: 0 }}>
          {imageSrc ? (
            <CardMedia
              component="img"
              image={imageError ? FALLBACK_IMG : imageSrc || FALLBACK_IMG}
              alt={blog.title}
              loading="eager"
              decoding="sync"
              onLoad={(e: any) => {
                const src: string =
                  e?.currentTarget?.currentSrc || imageSrc || '';
                console.log('[BlogCard] Image rendered', {
                  title: blog.title,
                  src:
                    src.slice(0, 64) + (src.length > 64 ? '…' : '')
                });
              }}
              onError={() => setImageError(true)}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.palette.grey[200]
              }}
            >
              <img
                src={FALLBACK_IMG}
                alt="placeholder"
                style={{ width: '40%', opacity: 0.5 }}
              />
            </Box>
          )}

          {/* Overlay with gradient */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background:
                'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              p: 2
            }}
          >
            <Typography
              variant="h6"
              component="h3"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 1.5,
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                lineHeight: 1.3,
                letterSpacing: '0.3px',
                fontSize: '1.1rem',
                fontFamily:
                  '"Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              {blog.title}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.primary.contrastText,
                backgroundColor: theme.palette.primary.main,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                boxShadow: theme.shadows[1],
                alignSelf: 'flex-start',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                },
                transition: 'all 0.2s ease'
              }}
            >
              <AccessTimeIcon
                fontSize="inherit"
                sx={{ fontSize: '0.85rem' }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: '0.3px',
                  color: 'inherit'
                }}
              >
                {formatDate(blog.createdAt)}
              </Typography>
            </Box>

            {(onEdit || onDelete) && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: 1
                }}
              >
                {onEdit && (
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.6)'
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {onDelete && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick();
                      }}
                      sx={{
                        color: 'white',
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.6)'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Content Section */}
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100% - 200px)',
            backgroundColor: theme.palette.background.default,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              mb: 2,
              '&::-webkit-scrollbar': {
                width: '4px'
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.grey[400],
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: theme.palette.grey[500]
              },
              paddingRight: 1
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1
              }}
            >
              {blog.author && (
                <Chip
                  label={blog.author.name || 'Unknown Author'}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.contrastText,
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: theme.palette.secondary.dark
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              )}
              {blog.updatedAt &&
                blog.updatedAt !== blog.createdAt && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor:
                        theme.palette.action.selected,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    <UpdateIcon
                      fontSize="small"
                      sx={{ color: theme.palette.text.secondary }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontWeight: 500
                      }}
                    >
                      Updated
                    </Typography>
                  </Box>
                )}
            </Box>
          </Box>
          <Box
            sx={{
              mt: 'auto',
              pt: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={handleViewClick}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: theme.palette.primary.main,
                borderRadius: 1,
                px: 2,
                py: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                },
                '& .MuiButton-endIcon': {
                  transition: 'transform 0.2s'
                },
                '&:hover .MuiButton-endIcon': {
                  transform: 'translateX(4px)'
                }
              }}
            >
              Read More
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Blog Detail Modal */}
      {openDetail && (
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
          onClick={() => setOpenDetail(false)}
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
                padding: 3
              },
              '& iframe': {
                width: '100%',
                minHeight: '500px',
                border: 'none',
                flexGrow: 1
              },
              '& .MuiTypography-h4': {
                fontSize: '2rem',
                marginBottom: '1.5rem'
              }
            }}
          >
            <IconButton
              onClick={() => setOpenDetail(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                zIndex: 1,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>

            <Box
              sx={{
                p: 4,
                overflowY: 'auto',
                flex: 1,
                '&::-webkit-scrollbar': {
                  width: '8px'
                },
                '&::-webkit-scrollbar-track': {
                  background: theme.palette.grey[100],
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.grey[400],
                  borderRadius: '4px',
                  '&:hover': {
                    background: theme.palette.grey[500]
                  }
                }
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                {blog.title}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3
                }}
              >
                {blog.author && (
                  <Chip
                    label={`By ${blog.author.name || 'Unknown Author'}`}
                    size="small"
                    sx={{
                      backgroundColor: theme.palette.primary.light,
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                )}

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {formatDate(blog.createdAt)}
                    {blog.updatedAt &&
                      blog.updatedAt !== blog.createdAt && (
                        <span> • Updated {formatDate(blog.updatedAt)}</span>
                      )}
                  </Typography>
                </Box>
              </Box>

              {imageSrc && (
                <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                  <img
                    src={imageError ? FALLBACK_IMG : imageSrc || FALLBACK_IMG}
                    alt={blog.title}
                    loading="eager"
                    decoding="sync"
                    onLoad={(e: any) => {
                      const src: string =
                        e?.currentTarget?.currentSrc || imageSrc || '';
                      console.log('[BlogCard Modal] Image rendered', {
                        title: blog.title,
                        src:
                          src.slice(0, 64) + (src.length > 64 ? '…' : '')
                      });
                    }}
                    onError={() => setImageError(true)}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </Box>
              )}

              {/* Document Viewer - Always show to all users */}
              {blog.googleDriveLink && (
                <Box
                  sx={{
                    width: '100%',
                    height: '70vh',
                    mt: 2,
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: 'background.paper',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <iframe
                      src={getDocumentViewerUrl(blog.googleDriveLink)}
                      width="100%"
                      height="100%"
                      style={{
                        border: 'none',
                        flexGrow: 1,
                        minHeight: 0
                      }}
                      title="Document Viewer"
                      allow="autoplay"
                      onError={() => setDocError(true)}
                    />
                    <Box
                      sx={{
                        width: '100%',
                        p: 2,
                        bgcolor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 2
                      }}
                    >
                      <Button
                        variant="outlined"
                        href={blog.googleDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<OpenInNewIcon />}
                      >
                        Open in Google Docs
                      </Button>
                      <Button
                        variant="outlined"
                        component={RouterLink}
                        to={`/blog/${blog.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<OpenInNewIcon />}
                      >
                        Open in New Tab
                      </Button>
                    </Box>
                  </Box>
                  {docError && (
                    <Box
                      sx={{
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
                      }}
                    >
                      <Typography color="error" gutterBottom>
                        Could not load the document. Please try opening it in a
                        new tab.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        component={RouterLink}
                        to={`/blog/${blog.id}`}
                        target="_blank"
                        sx={{ mt: 2 }}
                      >
                        Open in New Tab
                      </Button>
                    </Box>
                  )}
                </Box>
              )}

              <Box
                sx={{
                  mt: 4,
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'flex-end'
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => setOpenDetail(false)}
                >
                  Close
                </Button>
                {blog.googleDriveLink && (
                  <>
                    <Button
                      variant="outlined"
                      color="secondary"
                      href={blog.googleDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<OpenInNewIcon />}
                    >
                      Open in Google Docs
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      component={RouterLink}
                      to={`/blog/${blog.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<OpenInNewIcon />}
                    >
                      Open in New Tab
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

export default BlogCard;
