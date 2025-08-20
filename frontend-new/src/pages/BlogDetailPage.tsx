// 1) Imports at top
import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Chip
} from '@mui/material';
import { OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import api from '../api';
import { Blog } from '../types';

// Build a minimal Google Docs preview URL so it looks native
const getDocumentViewerUrl = (url: string): string => {
  try {
    const idMatch = url.match(/[\w-]{25,}/);
    const docId = idMatch ? idMatch[0] : '';
    if (!docId) return url;
    const params = new URLSearchParams({ rm: 'minimal', embedded: 'true', single: 'true' });
    return `https://docs.google.com/document/d/${docId}/preview?${params.toString()}`;
  } catch (error) {
    console.error('Error generating document viewer URL:', error);
    return url;
  }
};

interface BlogResponse {
  _id: string;
  title: string;
  googleDriveLink: string;
  image?: any;
  createdAt: string;
  updatedAt?: string;
  author?: { id: string; name: string; email: string };
  featured?: boolean;
}

const BlogDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docHtml, setDocHtml] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/blogs/${id}`);
        const payload = res?.data;
        const raw: BlogResponse | undefined = payload?.success ? payload.data : payload; // support either shape
        if (!raw) throw new Error('Invalid response');

        // Normalize image like BlogsPage
        let imageData = '';
        const img: any = raw.image;
        if (img) {
          if (typeof img === 'string') {
            imageData = img;
          } else if (typeof img === 'object') {
            if (typeof img.data === 'string') {
              imageData = `data:${img.contentType || 'image/jpeg'};base64,${img.data}`;
            } else if (typeof img?.data?.data === 'string') {
              imageData = `data:${img.contentType || 'image/jpeg'};base64,${img.data.data}`;
            } else if (img?.data?.type === 'Buffer' && Array.isArray(img?.data?.data)) {
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
            } else if (Array.isArray(img.data) && img.data.every((n: any) => typeof n === 'number')) {
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

        const normalized: Blog = {
          id: raw._id,
          title: raw.title,
          googleDriveLink: raw.googleDriveLink,
          image: imageData,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
          author: raw.author,
          featured: !!raw.featured,
        };

        if (isMounted) setBlog(normalized);
      } catch (err: any) {
        console.error('Error fetching blog detail:', err);
        if (isMounted) setError('Could not load this blog.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) fetchBlog();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Fetch native HTML content for the Google Doc
  useEffect(() => {
    let isMounted = true;
    async function fetchDoc() {
      if (!blog?.googleDriveLink || !id) return;
      setDocLoading(true);
      setDocHtml(null);
      try {
        const res = await api.get(`/api/blogs/${id}/content`);
        if (!isMounted) return;
        if (res.data?.success && typeof res.data.html === 'string') {
          setDocHtml(res.data.html);
        } else {
          setDocHtml(null);
        }
      } catch (e: any) {
        if (!isMounted) return;
        console.error('Failed to fetch doc content', e?.message || e);
        setDocHtml(null);
      } finally {
        if (isMounted) setDocLoading(false);
      }
    }
    fetchDoc();
    return () => { isMounted = false; };
  }, [blog?.googleDriveLink, id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !blog) {
    return (
      <Box p={3} maxWidth="900px" mx="auto">
        <Typography color="error" gutterBottom>
          {error || 'Blog not found.'}
        </Typography>
        <Button component={RouterLink} to="/">Back to Blogs</Button>
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth="1000px" mx="auto">
      <Typography variant="h3" component="h1" gutterBottom>
        {blog.title}
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        {blog.author && (
          <Chip label={blog.author.name || 'Unknown Author'} size="small" />
        )}
        <Typography variant="body2" color="textSecondary">
          {new Date(blog.createdAt).toLocaleString()}
          {blog.updatedAt && blog.updatedAt !== blog.createdAt && (
            <span> • Updated {new Date(blog.updatedAt).toLocaleString()}</span>
          )}
        </Typography>
      </Box>

      {typeof blog.image === 'string' && blog.image && (
        <Box mb={3}>
          <img src={blog.image} alt={blog.title} style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
        </Box>
      )}

      {blog.googleDriveLink && (
        <Box sx={{ width: '100%', backgroundColor: 'background.paper', borderRadius: 2, boxShadow: 1, p: { xs: 2, sm: 3 } }}>
          {docLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 6, justifyContent: 'center' }}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">Loading content…</Typography>
            </Box>
          )}
          {!docLoading && docHtml && (
            <Box
              sx={{
                '& img': { maxWidth: '100%', height: 'auto' },
                '& table': { width: '100%', overflowX: 'auto', display: 'block' },
                '& h1, & h2, & h3': { marginTop: '1.25rem' },
                '& p': { lineHeight: 1.8 }
              }}
              dangerouslySetInnerHTML={{ __html: docHtml }}
            />)
          }
          {!docLoading && !docHtml && (
            <Box sx={{ py: 4 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Unable to load native content. You can still view the document in Google Docs.
              </Typography>
              <Button
                variant="outlined"
                href={blog.googleDriveLink}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
              >
                Open in Google Docs
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default BlogDetailPage;
