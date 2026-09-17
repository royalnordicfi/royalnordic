import ReviewCarousel from './ReviewCarousel'
import { reviewsFor } from '../data/reviews'

const ReviewsHome = () => {
  return (
    <ReviewCarousel
      reviews={reviewsFor('general', 7)}
      eyebrow="Guest stories"
      title="What travellers remember"
      className="bg-midnight"
    />
  )
}

export default ReviewsHome
