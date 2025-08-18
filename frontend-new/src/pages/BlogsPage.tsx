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
    data: any;
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
        // Debug: inspect raw image shapes (first 1-2 items)
        try {
          const sample = (response.data || []).slice(0, 2).map((b: any) => ({
            title: b?.title,
            imageType: typeof b?.image,
            imageKeys: b?.image && typeof b.image === 'object' ? Object.keys(b.image) : [],
            dataType: b?.image && typeof b.image === 'object' ? typeof b.image.data : undefined,
            dataIsArray: Array.isArray(b?.image?.data),
            bufferType: b?.image?.data?.type,
            nestedDataType: typeof b?.image?.data?.data,
            nestedDataIsArray: Array.isArray(b?.image?.data?.data),
            nestedDataLen: typeof b?.image?.data?.data === 'string' ? b.image.data.data.length : (Array.isArray(b?.image?.data?.data) ? b.image.data.data.length : undefined),
          }));
          console.log('[fetchBlogs] raw image sample', sample);
        } catch {}
        const blogsWithId = response.data.map((blog: BlogResponse): Blog => {
          let imageData = '';
          const img: any = blog.image;
          
          if (img) {
            if (typeof img === 'string') {
              // Accept full data URI or http(s) URL
              imageData = img;
            } else if (typeof img === 'object') {
              // Case 1: server already sends base64 string
              if (typeof img.data === 'string') {
                imageData = `data:${img.contentType || 'image/jpeg'};base64,${img.data}`;
              }
              // Case 1b: nested base64 string e.g. { data: { data: 'base64...' }, contentType }
              else if (typeof img?.data?.data === 'string') {
                imageData = `data:${img.contentType || 'image/jpeg'};base64,${img.data.data}`;
              }
              // Case 2: Node Buffer-like: { data: { type: 'Buffer', data: number[] } }
              else if (img?.data?.type === 'Buffer' && Array.isArray(img?.data?.data)) {
                try {
                  const byteArray = new Uint8Array(img.data.data as number[]);
                  const chunkSize = 0x8000;
                  let binary = '';
                  for (let i = 0; i < byteArray.length; i += chunkSize) {
                    const chunk = byteArray.subarray(i, i + chunkSize);
                    binary += String.fromCharCode.apply(null, Array.from(chunk) as number[]);
                  }
                  const base64 = btoa(binary);
                  imageData = `data:${img.contentType || 'image/jpeg'};base64,${base64}`;
                } catch (e) {
                  console.warn('Failed to build data URL from buffer', e);
                }
              }
              // Case 3: plain number[] byte array
              else if (Array.isArray(img.data) && img.data.every((n: any) => typeof n === 'number')) {
                try {
                  const byteArray = new Uint8Array(img.data as number[]);
                  const chunkSize = 0x8000;
                  let binary = '';
                  for (let i = 0; i < byteArray.length; i += chunkSize) {
                    const chunk = byteArray.subarray(i, i + chunkSize);
                    binary += String.fromCharCode.apply(null, Array.from(chunk) as number[]);
                  }
                  const base64 = btoa(binary);
                  imageData = `data:${img.contentType || 'image/jpeg'};base64,${base64}`;
                } catch (e) {
                  console.warn('Failed to build data URL from byte array', e);
                }
              }
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
        console.log(
          'Blogs image debug:',
          blogsWithId.map((b: Blog) => ({
            title: b.title,
            hasImage:
              typeof b.image === 'string' && (b.image.startsWith('data:') || b.image.startsWith('http')),
            prefix: typeof b.image === 'string' ? b.image.slice(0, 16) : '',
            length: typeof b.image === 'string' ? b.image.length : 0,
          }))
        );
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
