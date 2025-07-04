// src/models/Post.ts
import mongoose from 'mongoose'

const PostSchema = new mongoose.Schema({
  title: String,
  description: String,
  categories: [String],
  location: String,
  region: String,
  coordinates: {
    lat: Number,
    lng: Number
  },
  type: {
    type: String,
    enum: ['HELP_REQUEST', 'HELP_OFFER'],
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'FULFILLED', 'CLOSED'],
    default: 'ACTIVE'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  volunteers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING'
    },
    createdAt: { type: Date, default: Date.now }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
})

export default mongoose.models.Post || mongoose.model('Post', PostSchema)