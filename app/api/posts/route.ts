// app/api/posts/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import mongoose from 'mongoose'

// Define Post Schema
const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  authorId: { type: String, required: true },     // Add authorId field
  authorEmail: { type: String, required: true },
  authorName: { type: String, default: "Anonymous" },
  authorImage: { type: String, default: null }
})

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema)

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to create a post." },
        { status: 401 }
      )
    }

    await connectDB
    const { title, content } = await req.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const post = await Post.create({
      title,
      content,
      authorId: session.user.id,        // Add the user ID
      authorEmail: session.user.email,
      authorName: session.user.name || "Anonymous",
      authorImage: session.user.image || null,
    })

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Error creating post" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    await connectDB
    const posts = await Post.find({}).sort({ createdAt: -1 })
    return NextResponse.json({ posts })
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Error fetching posts" },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to update a post." },
        { status: 401 }
      )
    }

    await connectDB
    const { id, title, content } = await req.json()

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify post ownership using authorId
    const existingPost = await Post.findOne({
      _id: id,
      authorId: session.user.id
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found or unauthorized" },
        { status: 404 }
      )
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        title,
        content,
        updatedAt: new Date()
      },
      { new: true }
    )

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Error updating post" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to delete a post." },
        { status: 401 }
      )
    }

    await connectDB
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      )
    }

    // Verify post ownership using authorId
    const post = await Post.findOne({
      _id: id,
      authorId: session.user.id
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found or unauthorized" },
        { status: 404 }
      )
    }

    await Post.findByIdAndDelete(id)

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Error deleting post" },
      { status: 500 }
    )
  }
}