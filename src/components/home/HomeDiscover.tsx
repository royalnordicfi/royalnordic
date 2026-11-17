import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EXPERIENCE_NAV } from '../../layout/nav'

/**
 * Floating discovery control — routes guests to real category pages.
 * Not a fake availability API; destinations match live public navigation.
 */
export default function HomeDiscover() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState(EXPERIENCE_NAV[0].to)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const target = EXPERIENCE_NAV.find((d) => d.to === destination)?.to || EXPERIENCE_NAV[0].to
    navigate(target)
  }

  return (
    <form
      className="rn-home-discover"
      onSubmit={onSubmit}
      aria-label="Find a Lapland experience"
    >
      <div className="rn-home-discover__field">
        <label htmlFor="rn-home-discover-exp" className="rn-home-discover__label">
          Experience
        </label>
        <select
          id="rn-home-discover-exp"
          className="rn-home-discover__select"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          {EXPERIENCE_NAV.map((item) => (
            <option key={item.to} value={item.to}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="rn-home-discover__hint" aria-hidden>
        <span className="rn-home-discover__hint-label">From</span>
        <span className="rn-home-discover__hint-value">Rovaniemi</span>
      </div>
      <button type="submit" className="rn-home-discover__btn">
        Explore
      </button>
    </form>
  )
}
