import Footer from '../Footer'
import HomeExplore from './HomeExplore'
import HomeFeatured from './HomeFeatured'
import HomeFinalCta from './HomeFinalCta'
import HomeGuides from './HomeGuides'
import HomeHero from './HomeHero'
import HomeOffers from './HomeOffers'
import HomePrivate from './HomePrivate'
import HomeReviews from './HomeReviews'
import HomeTransfers from './HomeTransfers'
import HomeWhy from './HomeWhy'

/**
 * Quiet-luxury homepage — cinematic hero into near-black editorial sections.
 * SiteIntro lives in SiteChrome.
 */
export default function HomePage() {
  return (
    <div className="rn-ql">
      <HomeHero />
      <HomeFeatured />
      <HomeOffers />
      <HomeExplore />
      <HomeWhy />
      <HomePrivate />
      <HomeTransfers />
      <HomeReviews />
      <HomeGuides />
      <HomeFinalCta />
      <Footer />
    </div>
  )
}
