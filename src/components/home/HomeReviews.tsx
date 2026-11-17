import ReviewCarousel from '../ReviewCarousel'
import { reviewsFor } from '../../data/reviews'

export default function HomeReviews() {
  return (
    <section className="rn-home-section rn-home-section--dark" aria-label="Guest reviews">
      <ReviewCarousel
        reviews={reviewsFor('general', 10)}
        eyebrow="Guest stories"
        title="What travellers remember"
        className="!border-0 !bg-transparent !py-0"
      />
    </section>
  )
}
