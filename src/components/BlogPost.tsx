import React from 'react'
import BlogArticleLayout, { type RelatedExperience } from './blog/BlogArticleLayout'

interface BlogPostProps {
  post: {
    id: number
    title: string
    slug: string
    content: string
    excerpt: string
    date?: string
    readTime: string
    category: string
    author?: string
    heroImage?: string
    relatedExperiences?: RelatedExperience[]
  }
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <BlogArticleLayout
      title={post.title}
      excerpt={post.excerpt}
      category={post.category}
      readTime={post.readTime}
      author={post.author}
      date={post.date}
      heroImage={post.heroImage}
      content={post.content}
      relatedExperiences={post.relatedExperiences}
    />
  )
}

export default BlogPost
