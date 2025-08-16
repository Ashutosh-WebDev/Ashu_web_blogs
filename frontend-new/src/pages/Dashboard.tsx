import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import { Blog, BlogFormData } from '../types';
import BlogForm from '../components/BlogForm';

// API base URL from environment or default to development
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Helper function to handle fetch with auth
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);
  
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Ensure proper URL concatenation without double slashes
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${baseUrl}/${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for sending cookies
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      response: errorText
    });
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  // Only parse as JSON if the response has content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
};

// Helper function to create a FileList from a single File
const createFileListFromFile = (file: File): FileList => {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  return dataTransfer.files;
};

// Blog service functions
const getBlogs = async (): Promise<Blog[]> => {
  try {
    return await fetchWithAuth('/api/blogs');
  } catch (error) {
    console.error('Error in getBlogs:', error);
    throw error;
  }
};

const createBlog = async (data: BlogFormData): Promise<Blog> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof File ? value : String(value));
    }
  });
  
  try {
    return await fetchWithAuth('/api/blogs', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    console.error('Error in createBlog:', error);
    throw error;
  }
};

const updateBlog = async (id: string, data: BlogFormData): Promise<Blog> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value instanceof File ? value : String(value));
    }
  });
  
  try {
    return await fetchWithAuth(`/api/blogs/${id}`, {
      method: 'PUT',
      body: formData,
    });
  } catch (error) {
    console.error('Error in updateBlog:', error);
    throw error;
  }
};

const deleteBlog = async (id: string): Promise<void> => {
  try {
    await fetchWithAuth(`/api/blogs/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    throw error;
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const data = await getBlogs();
        // Sort blogs by creation date (newest first)
        const sortedBlogs = [...data].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setBlogs(sortedBlogs);
        setError(null);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to load blogs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const handleCreateBlog = () => {
    setEditingBlog(null);
    setShowForm(true);
    setFormError(null);
  };

  const handleEditBlog = (blog: Blog) => {
    setEditingBlog(blog);
    setShowForm(true);
    setFormError(null);
  };

  const handleFormSubmit = async (formData: FormData) => {
    try {
      setFormLoading(true);
      setFormError(null);
      
      // Extract and validate form data
      const title = formData.get('title')?.toString().trim() || '';
      const googleDriveLink = formData.get('googleDriveLink')?.toString().trim() || '';
      const image = formData.get('image');
      
      if (!title || !googleDriveLink) {
        throw new Error('Title and Google Drive link are required');
      }
      
      // Create a BlogFormData object with proper image handling
      const blogData: BlogFormData = {
        title,
        googleDriveLink,
        // If we have an image, create a FileList-like object, otherwise use empty string
        image: image instanceof File ? 
          createFileListFromFile(image) : 
          ''
      };
      
      if (editingBlog?._id) {
        // Update existing blog
        const updatedBlog = await updateBlog(editingBlog._id, blogData);
        setBlogs(prevBlogs => 
          prevBlogs.map(blog => 
            blog._id === editingBlog._id ? updatedBlog : blog
          )
        );
      } else {
        // Create new blog
        const newBlog = await createBlog(blogData);
        setBlogs(prevBlogs => [newBlog, ...prevBlogs]);
      }
      
      setShowForm(false);
    } catch (error: unknown) {
      console.error('Error saving blog:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save blog. Please try again.';
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBlog = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }
    
    try {
      await deleteBlog(id);
      setBlogs(blogs.filter(blog => blog._id !== id));
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError('Failed to delete blog. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Welcome, {user?.name || 'User'}!
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateBlog}
            disabled={formLoading}
          >
            Create New Blog
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/blogs')}
            disabled={formLoading}
          >
            View All Blogs
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Your Blog Posts</Typography>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/blogs')}
              >
                View All Blogs
              </Button>
            </Box>
            
            {showForm && (
              <Paper sx={{ p: 3, mb: 4, mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                  </Typography>
                  <IconButton 
                    onClick={() => {
                      setShowForm(false);
                      setFormError(null);
                    }}
                    disabled={formLoading}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}
                
                <BlogForm
                  initialData={editingBlog || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setShowForm(false)}
                  loading={formLoading}
                />
              </Paper>
            )}
            
            {loading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" align="center" mt={4}>
                {error}
              </Typography>
            ) : blogs.length === 0 ? (
              <Typography>No blog posts found. Create your first post!</Typography>
            ) : (
              <List>
                {blogs.map((blog) => (
                  <ListItem 
                    key={blog._id} 
                    divider
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {blog.title}
                          {blog.featured && (
                            <Chip 
                              label="Featured" 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      }
                      secondary={`Created: ${new Date(blog.createdAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Box>
                        <IconButton 
                          edge="end" 
                          aria-label="edit" 
                          onClick={() => handleEditBlog(blog)}
                          disabled={formLoading}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDeleteBlog(blog._id)}
                          disabled={formLoading}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2} mt={2}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/blogs')}
                fullWidth
              >
                View All Blogs
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/profile')}
                fullWidth
              >
                Edit Profile
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                onClick={logout}
                fullWidth
              >
                Logout
              </Button>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Box mt={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" gutterBottom>
                {user?.email || 'N/A'}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary" mt={2}>
                Member Since
              </Typography>
              <Typography variant="body1">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
