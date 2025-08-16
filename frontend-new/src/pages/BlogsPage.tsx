import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Typography,
  CircularProgress,
  Box,
  Grid,
} from '@mui/material';
import BlogCard from '../components/BlogCard';
import { useAuth } from '../contexts/AuthContext';
import { Blog } from '../types';
import BlogCarousel from '../components/BlogCarousel';

interface BlogResponse {
  _id: string;
  title: string;
  googleDriveLink: string;
  image?: {
    data: string;
    contentType: string;
    filename?: string;
  } | string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

const BlogsPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  // Error handling removed from public view
  // const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Fetch blogs from API
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/blogs');
        const blogsWithId = response.data.map((blog: BlogResponse): Blog => {
          let imageData = '';
          
          if (blog.image) {
            if (typeof blog.image === 'string') {
              imageData = blog.image;
            } else if ('data' in blog.image) {
              imageData = `data:${blog.image.contentType || 'image/jpeg'};base64,${blog.image.data}`;
            }
          }
          
          return {
            id: blog._id,
            title: blog.title,
            googleDriveLink: blog.googleDriveLink,
            image: imageData,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
            author: blog.author
          };
        });
        
        setBlogs(blogsWithId);
      } catch (error) {
        console.error('Error fetching blogs:', error);
        // Error handling removed from public view
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Simple view handler for blog posts
  const handleViewBlog = (blog: Blog) => {
    // You can implement a detail view here if needed
    console.log('Viewing blog:', blog.id);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      maxWidth: '1400px',
      mx: 'auto',
      width: '100%'
    }}>
      

      {blogs.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No blog posts yet.
          </Typography>
        </Box>
      ) : (
        <>
          {/* Carousel Section */}
          <Box mb={6}>
            <Typography variant="h5" gutterBottom>
              Featured Posts
            </Typography>
            <BlogCarousel 
              blogs={blogs.slice(0, 5)}
              onView={handleViewBlog}
              isAuthenticated={isAuthenticated}
            />
          </Box>

          {/* Grid Section */}
          <Box mt={6}>
            <Typography variant="h5" gutterBottom>
              Latest Posts
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {blogs.map((blog) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  lg={3} 
                  key={blog.id} 
                  sx={{ 
                    display: 'flex',
                    minHeight: '400px' // Ensures consistent card height in the grid
                  }}
                >
                  <BlogCard
                    blog={blog}
                    onView={() => handleViewBlog(blog)}
                    showContent={isAuthenticated}
                    sx={{ height: '100%' }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}


    </Box>
  );
};

export default BlogsPage;
