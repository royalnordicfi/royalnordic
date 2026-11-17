import ReviewCarousel from './ReviewCarousel'
import { reviewsFor } from '../data/reviews'

const ReviewsHome = () => {
  return (
    <ReviewCarousel
      reviews={reviewsFor('general', 10)}
      eyebrow="Guest stories"
      title="What travellers remember"
      className="bg-midnight border-t border-white/[0.06]"
    />
  )
}

export default ReviewsHome
