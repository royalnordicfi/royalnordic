import React, { useState, useEffect, useCallback } from 'react'
import { 
  Calendar, 
  Users, 
  Mail, 
  Phone, 
  Euro, 
  Clock, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Trash2
} from 'lucide-react'
import { getAdminBookings, updateBookingStatus, sendManualConfirmationEmail, deleteBooking } from '../lib/api'
import {
  getAdminSession,
  onAdminAuthChange,
  signOutAdmin,
  type AdminSessionState,
} from '../lib/adminAuth'
import AdminLogin from './AdminLogin'
import AdminAvailability from './AdminAvailability'
import type { Booking } from '../lib/supabase'
import { formatTourDateLong } from '../lib/tourDate'

interface AdminBooking extends Booking {
  tours: { name: string }
  tour_dates: { date: string }
}

const AdminPanel: React.FC = () => {
  const [auth, setAuth] = useState<AdminSessionState | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ bookingId: number, customerName: string } | null>(null)

  useEffect(() => {
    let mounted = true
    getAdminSession()
      .then((state) => {
        if (mounted) {
          setAuth(state)
          setAuthChecked(true)
        }
      })
      .catch(() => {
        if (mounted) {
          setAuth({ session: null, user: null, isSignedIn: false })
          setAuthChecked(true)
        }
      })

    const unsubscribe = onAdminAuthChange((state) => {
      if (mounted) setAuth(state)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getAdminBookings()
      setBookings(data)
    } catch (err: any) {
      console.error('Error loading bookings:', err)
      setError(err.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (auth?.isSignedIn) {
      loadBookings()
    } else {
      setBookings([])
    }
  }, [auth?.isSignedIn, loadBookings])

  const handleSignOut = async () => {
    try {
      await signOutAdmin()
      setBookings([])
      setSelectedBooking(null)
    } catch (err: any) {
      setError(err.message || 'Failed to sign out')
    }
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking session…</p>
        </div>
      </div>
    )
  }

  if (!auth?.isSignedIn) {
    return <AdminLogin onSuccess={() => getAdminSession().then(setAuth)} />
  }

  // Update booking status
  const handleStatusUpdate = async (bookingId: number, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      setError('')
      await updateBookingStatus(bookingId, newStatus)
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus }
          : booking
      ))
    } catch (err: any) {
      console.error('Error updating booking status:', err)
      setError(err.message || 'Failed to update booking status')
    }
  }

  // Send manual confirmation email
  const handleSendConfirmationEmail = async (booking: AdminBooking) => {
    try {
      setSendingEmail(true)
      setEmailMessage(null)
      setError('')
      
      await sendManualConfirmationEmail(booking)
      
      setEmailMessage({ type: 'success', text: 'Confirmation email sent successfully!' })
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setEmailMessage(null)
      }, 3000)
    } catch (err: any) {
      console.error('Error sending confirmation email:', err)
      setEmailMessage({ type: 'error', text: err.message || 'Failed to send confirmation email' })
    } finally {
      setSendingEmail(false)
    }
  }

  // Delete booking
  const handleDeleteBooking = async (bookingId: number) => {
    try {
      setDeletingBookingId(bookingId)
      setError('')
      
      await deleteBooking(bookingId)
      
      // Remove from local state
      setBookings(prev => prev.filter(booking => booking.id !== bookingId))
      setDeleteConfirm(null)
      
      // If deleted booking was selected, clear selection
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null)
      }
    } catch (err: any) {
      console.error('Error deleting booking:', err)
      setError(err.message || 'Failed to delete booking')
    } finally {
      setDeletingBookingId(null)
    }
  }

  // Filter and search bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tours.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0),
    totalParticipants: bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.adults + b.children, 0)
  }

  // Format date (date-only ISO must not use UTC midnight parsing)
  const formatDate = (dateString: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return formatTourDateLong(dateString, 'fi-FI')
    }
    return new Date(dateString).toLocaleDateString('fi-FI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Royal Nordic Admin</h1>
              <p className="text-gray-600">Manage bookings and monitor your business</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:inline">
                {auth.user?.email}
              </span>
              <button
                onClick={loadBookings}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleSignOut}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-emerald-600">€{stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalParticipants}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or tour..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.customer_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {booking.customer_email}
                        </div>
                        {booking.customer_phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {booking.customer_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{booking.tours.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.tour_dates.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {booking.adults} adults, {booking.children} children
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        €{booking.total_price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(booking.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel booking"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {booking.status === 'cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900"
                            title="Re-activate booking"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm({ bookingId: booking.id, customerName: booking.customer_name })}
                          className="text-red-600 hover:text-red-900"
                          title="Delete booking"
                          disabled={deletingBookingId === booking.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {selectedBooking.customer_name}</p>
                    <p><strong>Email:</strong> {selectedBooking.customer_email}</p>
                    {selectedBooking.customer_phone && (
                      <p><strong>Phone:</strong> {selectedBooking.customer_phone}</p>
                    )}
                  </div>
                </div>

                {/* Tour Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tour Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Tour:</strong> {selectedBooking.tours.name}</p>
                    <p><strong>Date:</strong> {formatDate(selectedBooking.tour_dates.date)}</p>
                    <p><strong>Adults:</strong> {selectedBooking.adults}</p>
                    <p><strong>Children:</strong> {selectedBooking.children}</p>
                    <p><strong>Total Price:</strong> €{selectedBooking.total_price}</p>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Requests</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p>{selectedBooking.special_requests}</p>
                    </div>
                  </div>
                )}

                {/* Booking Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Booking ID:</strong> #{selectedBooking.id}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedBooking.status === 'confirmed' 
                          ? 'bg-green-100 text-green-800'
                          : selectedBooking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedBooking.status}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {formatDate(selectedBooking.created_at)} at {formatTime(selectedBooking.created_at)}</p>
                    {selectedBooking.stripe_payment_intent_id && (
                      <p><strong>Payment ID:</strong> {selectedBooking.stripe_payment_intent_id}</p>
                    )}
                  </div>
                </div>

                {/* Email Status Message */}
                {emailMessage && (
                  <div className={`rounded-lg p-4 mb-4 ${
                    emailMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center">
                      {emailMessage.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 mr-2" />
                      )}
                      <p className="font-medium">{emailMessage.text}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-3 pt-4 border-t">
                  <button
                    onClick={() => handleSendConfirmationEmail(selectedBooking)}
                    disabled={sendingEmail}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Confirmation Email
                      </>
                    )}
                  </button>
                  
                  <div className="flex space-x-3">
                    {selectedBooking.status === 'confirmed' && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedBooking.id, 'cancelled')
                          setSelectedBooking(null)
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {selectedBooking.status === 'cancelled' && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedBooking.id, 'confirmed')
                          setSelectedBooking(null)
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Re-activate Booking
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBooking(null)
                        setEmailMessage(null)
                      }}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Delete Booking</h2>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete the booking for <strong>{deleteConfirm.customerName}</strong>?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ This action cannot be undone. The booking will be permanently deleted.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleDeleteBooking(deleteConfirm.bookingId)}
                  disabled={deletingBookingId === deleteConfirm.bookingId}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingBookingId === deleteConfirm.bookingId ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Booking
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deletingBookingId === deleteConfirm.bookingId}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-8">
        <AdminAvailability tourId={1} tourName="Northern Lights Tour" maxCapacity={8} />
        <AdminAvailability tourId={2} tourName="Snowshoe Adventure" maxCapacity={3} />
      </div>
    </div>
  )
}

export default AdminPanel
