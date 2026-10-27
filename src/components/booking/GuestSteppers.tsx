type Props = {
  adults: number
  children: number
  maxGuests: number
  adultPrice: number
  childPrice: number
  pricingModel: 'per_person' | 'per_vehicle'
  onChange: (next: { adults: number; children: number }) => void
  formatMoney: (n: number) => string
}

export default function GuestSteppers({
  adults,
  children,
  maxGuests,
  adultPrice,
  childPrice,
  pricingModel,
  onChange,
  formatMoney,
}: Props) {
  const perVehicle = pricingModel === 'per_vehicle'
  const party = adults + children
  const room = Math.max(0, maxGuests - party)

  const bumpAdults = (delta: number) => {
    const next = Math.max(1, adults + delta)
    if (delta > 0 && next + children > maxGuests) return
    onChange({ adults: next, children })
  }

  const bumpChildren = (delta: number) => {
    const next = Math.max(0, children + delta)
    if (delta > 0 && adults + next > maxGuests) return
    onChange({ adults, children: next })
  }

  return (
    <div className="rn-guest-steppers">
      <div className="rn-guest-steppers__row">
        <div>
          <p className="rn-book-widget__label">{perVehicle ? 'Passengers (adults)' : 'Adults'}</p>
          <p className="rn-guest-steppers__meta">
            {perVehicle ? 'Age 18+' : `Age 18+ · €${formatMoney(adultPrice)}`}
          </p>
        </div>
        <div className="rn-guest-steppers__controls">
          <button type="button" aria-label="Fewer adults" onClick={() => bumpAdults(-1)} disabled={adults <= 1}>
            −
          </button>
          <span aria-live="polite">{adults}</span>
          <button
            type="button"
            aria-label="More adults"
            onClick={() => bumpAdults(1)}
            disabled={room <= 0}
          >
            +
          </button>
        </div>
      </div>

      <div className="rn-guest-steppers__row">
        <div>
          <p className="rn-book-widget__label">{perVehicle ? 'Passengers (children)' : 'Children'}</p>
          <p className="rn-guest-steppers__meta">
            {perVehicle ? 'Age 0–17' : `Age 0–17 · €${formatMoney(childPrice)}`}
          </p>
        </div>
        <div className="rn-guest-steppers__controls">
          <button
            type="button"
            aria-label="Fewer children"
            onClick={() => bumpChildren(-1)}
            disabled={children <= 0}
          >
            −
          </button>
          <span aria-live="polite">{children}</span>
          <button
            type="button"
            aria-label="More children"
            onClick={() => bumpChildren(1)}
            disabled={room <= 0}
          >
            +
          </button>
        </div>
      </div>

      {perVehicle ? (
        <p className="rn-guest-steppers__note">Price is per vehicle, not per person.</p>
      ) : null}
    </div>
  )
}
