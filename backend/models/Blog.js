const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters long']
    },
    googleDriveLink: {
        type: String,
        required: [true, 'Google Drive link is required'],
        trim: true
    },
    image: {
        data: Buffer,
        contentType: String,
        filename: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            // Convert _id to id and remove _id and __v from the response
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            
            // Convert image buffer to base64 string if it exists
            if (ret.image && ret.image.data) {
                ret.image.data = ret.image.data.toString('base64');
            }
            
            return ret;
        }
    }
});

module.exports = mongoose.model('Blog', blogSchema);
