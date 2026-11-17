import BlogArticleLayout, {
  type ArticleFigure,
  type RelatedExperience,
} from './blog/BlogArticleLayout'
import { getBlogEntry } from '../data/blogCatalog'

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
    heroImageAlt?: string
    relatedExperiences?: RelatedExperience[]
    figures?: ArticleFigure[]
  }
}

const BlogPost = ({ post }: BlogPostProps) => {
  const catalog = getBlogEntry(post.slug)

  return (
    <BlogArticleLayout
      title={post.title}
      excerpt={post.excerpt}
      category={post.category}
      readTime={post.readTime}
      slug={post.slug}
      author={post.author}
      date={post.date}
      heroImage={post.heroImage || catalog?.image}
      heroImageAlt={post.heroImageAlt || catalog?.imageAlt}
      content={post.content}
      relatedExperiences={post.relatedExperiences}
      figures={post.figures}
    />
  )
}

export default BlogPost
