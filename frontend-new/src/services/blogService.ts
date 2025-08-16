import { Blog, BlogFormData } from '../types';
import api from '../api';
import { AxiosError } from 'axios';

// Type guard to check if error is an AxiosError
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError === true;
}

export const getBlogs = async (): Promise<Blog[]> => {
  try {
    const response = await api.get('/api/blogs');
    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching blogs:', error);
    
    if (isAxiosError(error)) {
      if (error.response) {
        const responseData = error.response.data as { message?: string };
        const enhancedError = new Error(
          responseData?.message || 'Failed to fetch blogs'
        );
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      } else if (error.request) {
        throw new Error('No response received from server');
      }
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unknown error occurred while fetching blogs');
  }
};

export const getBlogById = async (id: string): Promise<Blog> => {
  try {
    const response = await api.get(`/api/blogs/${id}`);
    
    if (!response.data.success) {
      const error = new Error(response.data.message || 'Failed to fetch blog');
      (error as any).code = response.data.error;
      throw error;
    }
    
    return response.data.data;
  } catch (error: unknown) {
    console.error(`Error fetching blog with id ${id}:`, error);
    
    // Type guard to check if error is an Axios error
    if (isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const responseData = error.response.data as { message?: string; error?: string };
        const enhancedError = new Error(
          responseData?.message || 'Failed to fetch blog'
        );
        (enhancedError as any).code = responseData?.error || 'UNKNOWN_ERROR';
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      } else if (error.request) {
        // The request was made but no response was received
        const enhancedError = new Error('No response received from server');
        (enhancedError as any).code = 'NO_RESPONSE';
        throw enhancedError;
      }
    }
    
    // Handle non-Axios errors or rethrow if we can't handle it
    if (error instanceof Error) {
      const enhancedError = new Error(error.message || 'Error setting up request');
      (enhancedError as any).code = (error as any).code || 'REQUEST_ERROR';
      throw enhancedError;
    }
    
    // If we get here, it's an unknown error type
    const unknownError = new Error('An unknown error occurred');
    (unknownError as any).code = 'UNKNOWN_ERROR';
    throw unknownError;
  }
};

export const createBlog = async (blogData: BlogFormData): Promise<Blog> => {
  try {
    const formData = new FormData();
    
    // Append all fields from blogData to formData
    Object.entries(blogData).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) {
        formData.append('image', value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    const response = await api.post('/api/blogs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.data.success) {
      const error = new Error(response.data.message || 'Failed to create blog');
      (error as any).code = response.data.error;
      throw error;
    }
    
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error creating blog:', error);
    
    if (isAxiosError(error)) {
      if (error.response) {
        const responseData = error.response.data as { message?: string; error?: string };
        const enhancedError = new Error(
          responseData?.message || 'Failed to create blog'
        );
        (enhancedError as any).code = responseData?.error || 'CREATE_BLOG_ERROR';
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      } else if (error.request) {
        throw new Error('No response received from server while creating blog');
      }
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unknown error occurred while creating the blog');
  }
};

export const updateBlog = async (id: string, blogData: Partial<BlogFormData> | FormData): Promise<Blog> => {
  try {
    // If blogData is already a FormData object, use it directly
    const data = blogData instanceof FormData ? blogData : new FormData();
    
    // If blogData is a plain object, convert it to FormData
    if (!(blogData instanceof FormData)) {
      Object.entries(blogData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'image' && value instanceof FileList && value.length > 0) {
            data.append('image', value[0]);
          } else {
            data.append(key, String(value));
          }
        }
      });
    }
    
    const response = await api.put(`/api/blogs/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.data.success) {
      const error = new Error(response.data.message || 'Failed to update blog');
      (error as any).code = response.data.error;
      throw error;
    }
    
    return response.data.data;
  } catch (error: unknown) {
    console.error(`Error updating blog with id ${id}:`, error);
    
    if (isAxiosError(error)) {
      if (error.response) {
        const responseData = error.response.data as { message?: string; error?: string };
        const enhancedError = new Error(
          responseData?.message || 'Failed to update blog'
        );
        (enhancedError as any).code = responseData?.error || 'UPDATE_BLOG_ERROR';
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      } else if (error.request) {
        throw new Error('No response received from server while updating blog');
      }
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unknown error occurred while updating the blog');
  }
};

export const deleteBlog = async (id: string): Promise<void> => {
  try {
    const response = await api.delete(`/api/blogs/${id}`);
    
    if (!response.data.success) {
      const error = new Error(response.data.message || 'Failed to delete blog');
      (error as any).code = response.data.error;
      throw error;
    }
  } catch (error: unknown) {
    console.error(`Error deleting blog with id ${id}:`, error);
    
    if (isAxiosError(error)) {
      if (error.response) {
        const responseData = error.response.data as { message?: string; error?: string };
        const enhancedError = new Error(
          responseData?.message || 'Failed to delete blog'
        );
        (enhancedError as any).code = responseData?.error || 'DELETE_BLOG_ERROR';
        (enhancedError as any).status = error.response.status;
        throw enhancedError;
      } else if (error.request) {
        throw new Error('No response received from server while deleting blog');
      }
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('An unknown error occurred while deleting the blog');
  }
};
