// app/posts/[id]/page.tsx
interface PostPageProps {
    params: {
      id: string
    }
  }
  
  export default function PostPage({ params }: PostPageProps) {
    return (
      <div>
        <h1>Post {params.id}</h1>
        {/* Your post detail page content */}
      </div>
    )
  }