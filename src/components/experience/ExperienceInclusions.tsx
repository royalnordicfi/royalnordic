type Props = {
  included: string[]
  notIncluded?: string[]
  className?: string
}

export default function ExperienceInclusions({ included, notIncluded = [], className = '' }: Props) {
  return (
    <div className={`rn-inclusions grid gap-8 sm:grid-cols-2 ${className}`}>
      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
          Included
        </h3>
        <ul className="mt-4 space-y-2.5">
          {included.map((item) => (
            <li key={item} className="rn-inclusions__item">
              <span className="rn-inclusions__dot rn-inclusions__dot--in" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {notIncluded.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
            Not included
          </h3>
          <ul className="mt-4 space-y-2.5">
            {notIncluded.map((item) => (
              <li key={item} className="rn-inclusions__item">
                <span className="rn-inclusions__dot rn-inclusions__dot--out" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
