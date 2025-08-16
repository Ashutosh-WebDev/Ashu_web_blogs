const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');
const upload = require('../utils/fileUpload');

// Create a new blog with image upload
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, googleDriveLink } = req.body;
        
        const blogData = {
            title,
            googleDriveLink,
            author: req.user.id
        };

        // If there's an uploaded file, add it to blogData
        if (req.file) {
            blogData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname
            };
        }

        const blog = new Blog(blogData);
        await blog.save();
        
        res.status(201).json(blog);
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(400).json({ 
            message: 'Error creating blog',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid data provided'
        });
    }
});

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find()
            .sort({ createdAt: -1 })
            .populate('author', 'name')
            .lean();
        
        // Convert image buffers to base64 for the response
        const blogsWithBase64Images = blogs.map(blog => {
            if (blog.image && blog.image.data) {
                return {
                    ...blog,
                    image: {
                        ...blog.image,
                        data: blog.image.data.toString('base64')
                    }
                };
            }
            return blog;
        });
            
        res.json(blogsWithBase64Images);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ 
            message: 'Error fetching blogs',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get a single blog
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`Invalid blog ID format: ${id}`);
        return res.status(400).json({ 
            success: false,
            message: 'Invalid blog ID format',
            error: 'INVALID_ID_FORMAT'
        });
    }
    
    try {
        console.log(`Fetching blog with ID: ${id}`);
        const blog = await Blog.findById(id)
            .populate('author', 'name')
            .lean();
            
        if (!blog) {
            console.error(`Blog not found with ID: ${id}`);
            return res.status(404).json({ 
                success: false,
                message: 'Blog not found',
                error: 'BLOG_NOT_FOUND'
            });
        }
        
        console.log(`Successfully fetched blog: ${blog.title} (ID: ${id})`);
        res.json({
            success: true,
            data: blog
        });
        
    } catch (error) {
        console.error(`Error fetching blog with ID ${id}:`, error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching blog',
            error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_SERVER_ERROR',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Update a blog with optional image upload
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        
        // Check if user is the author
        if (blog.author.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { title, googleDriveLink } = req.body;
        blog.title = title || blog.title;
        blog.googleDriveLink = googleDriveLink || blog.googleDriveLink;

        // If there's a new image, update it
        if (req.file) {
            blog.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
                filename: req.file.originalname
            };
        }

        await blog.save();
        
        // Convert buffer to base64 for the response
        const blogObj = blog.toObject();
        if (blogObj.image && blogObj.image.data) {
            blogObj.image.data = blogObj.image.data.toString('base64');
        }
        
        res.json(blogObj);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(400).json({ 
            message: 'Error updating blog',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid data provided'
        });
    }
});

// Delete a blog
router.delete('/:id', auth, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Blog not found' });
        
        // Check if user is the author
        if (blog.author.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Use deleteOne() instead of remove() as it's the recommended way in newer Mongoose versions
        await Blog.deleteOne({ _id: req.params.id });
        res.json({ message: 'Blog removed successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ 
            message: 'Error deleting blog',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;
