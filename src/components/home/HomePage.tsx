import Footer from '../Footer'
import HomeEditorial from './HomeEditorial'
import HomeExperiences from './HomeExperiences'
import HomeFinalCta from './HomeFinalCta'
import HomeFlagship from './HomeFlagship'
import HomeHero from './HomeHero'
import HomeJournal from './HomeJournal'
import HomeMore from './HomeMore'
import HomeOffers from './HomeOffers'
import HomePrivate from './HomePrivate'
import HomeReasons from './HomeReasons'
import HomeReviews from './HomeReviews'
import HomeTransfers from './HomeTransfers'

/**
 * Royal Nordic 2.0 homepage — full commercial depth under one cinematic system.
 * SiteIntro (session timelapse) lives in SiteChrome.
 *
 * Order preserves pre-2.0 richness: discover → categories → offers → flagship →
 * more products → storytelling → private → transfers → trust → reviews → journal → CTA.
 */
export default function HomePage() {
  return (
    <div className="rn-home">
      <HomeHero />
      <HomeExperiences />
      <HomeOffers />
      <HomeFlagship />
      <HomeMore />
      <HomeEditorial />
      <HomePrivate />
      <HomeTransfers />
      <HomeReasons />
      <HomeReviews />
      <HomeJournal />
      <HomeFinalCta />
      <Footer variant="home" />
    </div>
  )
}
