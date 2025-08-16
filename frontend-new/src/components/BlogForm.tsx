import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Typography,
  IconButton,
} from '@mui/material';
import { Image as ImageIcon, Close } from '@mui/icons-material';
import { BlogFormData } from '../types';
import { isValidGoogleDocsUrl } from '../utils/validation';

interface BlogFormState {
  title: string;
  googleDriveLink: string;
  image?: File | null;
}

interface BlogFormProps {
  initialData?: BlogFormData;
  onSubmit: (data: FormData) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

// Custom hook for handling image URLs with fallbacks
const useImageWithFallback = (url: string) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      setImageUrl('');
      setError(null);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const tryUrl = async (testUrl: string, isFallback = false) => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // First, try a HEAD request to check if the URL is accessible
        const response = await fetch(testUrl, {
          method: 'HEAD',
          signal: controller.signal,
          mode: 'no-cors', // This is just to check if the URL is reachable
        });

        // If we get here, the URL is accessible
        if (isMounted) {
          setImageUrl(testUrl);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        
        if (!isFallback) {
          // Try with a CORS proxy as fallback
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(testUrl)}`;
          await tryUrl(proxyUrl, true);
        } else {
          setError('Could not load image. The URL may be invalid or the server may be blocking access.');
          setImageUrl('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    tryUrl(url);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [url]);

  return { imageUrl, error, isLoading };
};

const BlogForm: React.FC<BlogFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<BlogFormState>({
    title: '',
    googleDriveLink: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with initialData if provided
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        googleDriveLink: initialData.googleDriveLink || '',
        image: null
      });
      // If there's an existing image, show it as a preview
      if (initialData.image) {
        if (typeof initialData.image === 'string') {
          setImagePreview(initialData.image);
        } else if ('data' in initialData.image) {
          // Handle BlogImage object
          const mimeType = initialData.image.contentType || 'image/jpeg';
          setImagePreview(`data:${mimeType};base64,${initialData.image.data}`);
        }
      }
    }
  }, [initialData]);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        image: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      }));
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        image: 'Image size should be less than 5MB'
      }));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    };
    reader.readAsDataURL(file);
    
    // Clear any previous errors
    if (errors.image) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.googleDriveLink) {
      newErrors.googleDriveLink = 'Google Drive link is required';
    } else if (!isValidGoogleDocsUrl(formData.googleDriveLink)) {
      newErrors.googleDriveLink = 'Please enter a valid Google Docs URL';
    }
    
    // Image is optional, no validation needed beyond what's in handleFileChange
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for the field being edited
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof typeof newErrors];
        return newErrors;
      });
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('googleDriveLink', formData.googleDriveLink);
      
      if (formData.image) {
        formDataToSubmit.append('image', formData.image);
      }
      
      await onSubmit(formDataToSubmit);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors(prev => ({ 
        ...prev, 
        form: 'Failed to submit form. Please try again.' 
      }));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="title"
        label="Blog Title"
        name="title"
        autoComplete="off"
        autoFocus
        value={formData.title}
        onChange={handleChange}
        error={!!errors.title}
        helperText={errors.title}
        disabled={loading}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="googleDriveLink"
        label="Google Drive Document Link"
        type="url"
        id="googleDriveLink"
        autoComplete="off"
        value={formData.googleDriveLink}
        onChange={handleChange}
        error={!!errors.googleDriveLink}
        helperText={
          errors.googleDriveLink ||
          'Make sure the document is shared with "Anyone with the link"'
        }
        disabled={loading}
      />

      <Box mt={2} mb={2}>
        <Typography variant="subtitle2" gutterBottom>
          Upload Blog Image (Optional)
        </Typography>
        <Box mb={3}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<ImageIcon />}
            fullWidth
            sx={{ mb: 2 }}
          >
            {formData.image ? 'Change Image' : 'Select Image'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </Button>
          
          {errors.image && (
            <Typography color="error" variant="caption" display="block" sx={{ mt: 1, mb: 1 }}>
              {errors.image}
            </Typography>
          )}
          
          {imagePreview && (
            <Box mt={2} textAlign="center">
              <Typography variant="caption" display="block" gutterBottom>
                Image Preview:
              </Typography>
              <Box 
                sx={{
                  position: 'relative',
                  maxWidth: '100%',
                  margin: '0 auto',
                  display: 'inline-block'
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    objectFit: 'contain'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setImagePreview('');
                    setFormData(prev => ({ ...prev, image: null }));
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {initialData ? 'Update Post' : 'Create Post'}
        </Button>
      </Box>
    </Box>
  );
};

export default BlogForm;
