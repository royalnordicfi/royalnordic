import ReviewCarousel from './ReviewCarousel'
import { reviewsFor } from '../data/reviews'

const ReviewsHome = () => {
  return (
    <ReviewCarousel
      reviews={reviewsFor('general', 10)}
      eyebrow="Guest stories"
      title="What travellers remember"
      className="bg-[#040807]"
    />
  )
}

export default ReviewsHome
