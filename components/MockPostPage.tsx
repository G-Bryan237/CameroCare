"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Row } from '@/lib/mock-store'
import { apiFetch } from '@/lib/api-fetch'
export default function MockPostPage({ id }: { id: string }) {
  const [post, setPost] = useState<Row | null | undefined>(undefined)
  useEffect(() => {
    let active = true
    apiFetch(`/api/posts/${id}`).then(async response => response.ok ? response.json() : null).then(post => { if (active) setPost(post) })
    return () => { active = false }
  }, [id])
  return <main className="mx-auto max-w-3xl p-8"><Link href="/feed" className="text-blue-600">Back to feed</Link>{post === undefined ? <p>Loading...</p> : post === null ? <p>This demo post is not available in this browser.</p> : <article className="mt-6 rounded-xl bg-white p-6 shadow"><h1 className="text-3xl font-bold">{post.title}</h1><p className="my-4 whitespace-pre-wrap">{post.description}</p><p>{post.location}, {post.region}</p><p className="mt-4">{post.categories.join(' / ')}</p><p>{post.type === 'HELP_REQUEST' ? 'Help request' : 'Help offer'} - {post.status}</p></article>}</main>
}
