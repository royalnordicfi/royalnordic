type Props = {
  adults: number
  children: number
  maxGuests: number
  adultPrice: number
  childPrice: number
  pricingModel: 'per_person' | 'per_vehicle'
  onChange: (next: { adults: number; children: number }) => void
  formatMoney: (n: number) => string
  /** Overrides the default per-vehicle pricing note. */
  priceNote?: string
  /** Private groups use “guests”; transfers use “passengers”. */
  partyNoun?: 'guests' | 'passengers'
  /** Optional catalogue reference (strikethrough) for adult/child. */
  adultReferencePrice?: number
  childReferencePrice?: number
  adultSaveLabel?: string
  childSaveLabel?: string
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
  priceNote,
  partyNoun = 'guests',
  adultReferencePrice,
  childReferencePrice,
  adultSaveLabel,
  childSaveLabel,
}: Props) {
  const perVehicle = pricingModel === 'per_vehicle'
  const usePassengers = perVehicle && partyNoun === 'passengers'
  const party = adults + children
  const room = Math.max(0, maxGuests - party)
  const adultOnSale =
    !perVehicle &&
    typeof adultReferencePrice === 'number' &&
    adultReferencePrice > adultPrice
  const childOnSale =
    !perVehicle &&
    typeof childReferencePrice === 'number' &&
    childReferencePrice > childPrice

  const priceMeta = (
    current: number,
    reference: number | undefined,
    onSale: boolean,
    saveLabel?: string,
  ) => {
    if (!onSale || reference == null) return `€${formatMoney(current)}`
    return (
      <>
        <span className="rn-guest-steppers__was">€{formatMoney(reference)}</span>{' '}
        <span className="rn-guest-steppers__now">€{formatMoney(current)}</span>
        {saveLabel ? <span className="rn-guest-steppers__save">{saveLabel}</span> : null}
      </>
    )
  }

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
          <p className="rn-book-widget__label">
            {usePassengers ? 'Passengers (adults)' : perVehicle ? 'Adults in your group' : 'Adults'}
          </p>
          <p className="rn-guest-steppers__meta">
            {perVehicle
              ? 'Age 18+'
              : (
                  <>
                    Age 18+ ·{' '}
                    {priceMeta(adultPrice, adultReferencePrice, adultOnSale, adultSaveLabel)}
                  </>
                )}
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
          <p className="rn-book-widget__label">
            {usePassengers ? 'Passengers (children)' : perVehicle ? 'Children in your group' : 'Children'}
          </p>
          <p className="rn-guest-steppers__meta">
            {perVehicle
              ? 'Age 0–17'
              : (
                  <>
                    Age 0–17 ·{' '}
                    {priceMeta(childPrice, childReferencePrice, childOnSale, childSaveLabel)}
                  </>
                )}
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
        <p className="rn-guest-steppers__note">
          {priceNote || 'Price is per vehicle, not per person.'}
        </p>
      ) : null}
    </div>
  )
}
