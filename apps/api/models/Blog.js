// models/Blog.js
import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  thumbnail: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Technology',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  authorName: {
    type: String,
    default: 'Admin'
  },
  authorAvatar: {
    type: String,
    default: ''
  },
  author: {
    name: {
      type: String,
      default: 'Admin'
    },
    avatar: {
      type: String,
      default: ''
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  published: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for search
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
export default Blog;