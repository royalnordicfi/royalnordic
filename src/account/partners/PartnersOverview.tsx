import { Link, useOutletContext } from 'react-router-dom'
import type { PartnerAccessResult } from '../partnerAccess'

type Ctx = { access: PartnerAccessResult }

export default function PartnersOverview() {
  const { access } = useOutletContext<Ctx>()
  const company = access.company_name || 'Your company'

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-xl font-semibold tracking-tight text-white sm:text-[1.35rem]">
          Welcome, {company}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Manage your travel-trade partnership with Royal Nordic. Browse assigned net rates, submit
          booking requests, and track confirmation status for your company.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
            Access status
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-aurora-soft">Approved</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--rn-text-muted)]">
            Membership role: {access.member_role || 'owner'}
          </p>
        </div>
        <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
            Bookings
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-white/90">Requests</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--rn-text-muted)]">
            Submit booking requests at negotiated net rates for Royal Nordic confirmation.
          </p>
        </div>
        <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
            Partner rates
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-white/90">Assigned nets</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--rn-text-muted)]">
            Company-specific net rates appear on tours when Royal Nordic assigns them.
          </p>
        </div>
      </div>

      <section className="rounded-[var(--rn-radius)] border border-dashed border-[var(--rn-border)] bg-white/[0.02] px-5 py-8 text-center sm:px-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
          Booking requests
        </p>
        <p className="mt-3 font-display text-lg font-semibold text-white/90">Request travel at net rates</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Browse tours with assigned partner pricing, submit a request, and track confirmation
          status. Public retail checkout is unchanged.
        </p>
        <Link
          to="/partners/dashboard/bookings"
          className="rn-btn-secondary mt-5 inline-flex min-h-[44px]"
        >
          Open bookings
        </Link>
      </section>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <Link
          to="/partners/dashboard/tours"
          className="rn-btn-primary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Browse tours
        </Link>
        <Link
          to="/partners/dashboard/company"
          className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Company profile
        </Link>
        <Link
          to="/partners/dashboard/account"
          className="rn-btn-secondary min-h-[44px] w-full justify-center sm:w-auto"
        >
          Partner account
        </Link>
      </div>
    </div>
  )
}
