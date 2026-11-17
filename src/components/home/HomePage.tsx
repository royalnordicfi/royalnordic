import Footer from '../Footer'
import HomeEditorial from './HomeEditorial'
import HomeExperiences from './HomeExperiences'
import HomeFinalCta from './HomeFinalCta'
import HomeFlagship from './HomeFlagship'
import HomeHero from './HomeHero'
import HomeJournal from './HomeJournal'
import HomeReasons from './HomeReasons'
import HomeReviews from './HomeReviews'

/**
 * Royal Nordic 2.0 homepage — cinematic hero + ivory editorial rhythm.
 * SiteIntro (session timelapse) lives in SiteChrome.
 */
export default function HomePage() {
  return (
    <div className="rn-home">
      <HomeHero />
      <HomeExperiences />
      <HomeFlagship />
      <HomeEditorial />
      <HomeReasons />
      <HomeReviews />
      <HomeJournal />
      <HomeFinalCta />
      <Footer variant="home" />
    </div>
  )
}
