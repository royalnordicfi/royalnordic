import React, { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { updateTourAvailability } from '../lib/api'
import { supabase } from '../lib/supabase'
import type { TourDate } from '../lib/supabase'

interface AdminAvailabilityProps {
  tourId: number
  tourName: string
  maxCapacity: number
}

const AdminAvailability: React.FC<AdminAvailabilityProps> = ({ tourId, tourName, maxCapacity }) => {
  const [availability, setAvailability] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingSlots, setEditingSlots] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)

  // Load availability data
  useEffect(() => {
    loadAvailability()
  }, [tourId, loadAvailability])

  // Auto-refresh availability when month changes
  useEffect(() => {
    loadAvailability()
  }, [currentMonth, loadAvailability])

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true)
      // Use the new Supabase function instead of the old API
      const { data, error } = await supabase.functions.invoke('get-tour-availability', {
        body: { tourId }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Transform the response to match the expected format
      const transformedData = data.availableDates.map((date: any) => ({
        id: date.id,
        tour_id: tourId,
        date: date.date,
        available_slots: date.totalSlots,
        total_booked: date.bookedSlots,
        remaining_slots: date.availableSpots
      }))
      
      setAvailability(transformedData)
    } catch (err) {
      console.error('Availability error:', err)
    } finally {
      setLoading(false)
    }
  }, [tourId])

  // Get month name and year
  const getMonthYearString = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Get calendar grid for current month
  const getCalendarGrid = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)
    
    // Get available dates for this month
    const monthDates = availability.filter(date => {
      const dateObj = new Date(date.date)
      return dateObj >= startDate && dateObj <= endDate
    })
    
    // Create a map for faster lookup
    const dateMap = new Map()
    monthDates.forEach(date => {
      dateMap.set(date.date, date)
    })

    // Create calendar grid
    const grid = []
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }

    // Add ALL days of the month (professional approach)
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(year, month, day).toISOString().split('T')[0]
      const dateData = dateMap.get(dateString)
      
      // Check if date is in the past
      const today = new Date()
      const todayString = today.toISOString().split('T')[0]
      const isPastDate = dateString < todayString
      
      // Check if date is in season (for Northern Lights: Sep 15 - Apr 15, Snowshoe: Nov 1 - Apr 1)
      let inSeason = true
      if (tourId === 1) { // Northern Lights
        const date = new Date(dateString)
        const month = date.getMonth() + 1
        const dayOfMonth = date.getDate()
        inSeason = (month === 9 && dayOfMonth >= 15) || 
                   (month >= 10 && month <= 12) || 
                   (month >= 1 && month <= 3) || 
                   (month === 4 && dayOfMonth <= 15)
      } else if (tourId === 2) { // Snowshoe
        const date = new Date(dateString)
        const month = date.getMonth() + 1
        const dayOfMonth = date.getDate()
        inSeason = (month === 11 && dayOfMonth >= 1) || 
                   (month === 12) || 
                   (month >= 1 && month <= 3) || 
                   (month === 4 && dayOfMonth <= 1)
      }
      
      grid.push({
        day,
        date: dateString,
        available: dateData ? dateData.remaining_slots > 0 : false,
        remainingSlots: dateData?.remaining_slots || 0,
        hasData: !!dateData,
        isPastDate,
        inSeason
      })
    }

    return grid
  }

  // Handle date selection
  const handleDateClick = (date: string, currentSlots: number) => {
    setSelectedDate(date)
    setEditingSlots(currentSlots)
    setIsEditing(true)
  }

  // Save availability changes
  const handleSaveAvailability = async () => {
    if (!selectedDate) return

    try {
      setLoading(true)
      setError('')
      
      // Use the new Supabase function
      const { data, error } = await supabase.functions.invoke('update-tour-availability', {
        body: { 
          tourId, 
          date: selectedDate, 
          availableSlots: editingSlots 
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Update local state
      const existingIndex = availability.findIndex(d => d.date === selectedDate)
      if (existingIndex >= 0) {
        // Update existing date
        const updated = [...availability]
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          available_slots: editingSlots,
          remaining_slots: editingSlots - (updated[existingIndex].total_booked || 0)
        }
        setAvailability(updated)
      } else {
        // Add new date
        const newDate: TourDate = {
          id: Date.now(), // Temporary ID
          tour_id: tourId,
          date: selectedDate,
          available_slots: editingSlots,
          total_booked: 0,
          remaining_slots: editingSlots,
          created_at: new Date().toISOString()
        }
        setAvailability(prev => [...prev, newDate])
      }
      
      setIsEditing(false)
      setSelectedDate(null)
    } catch (err: any) {
      setError(err.message || 'Failed to update availability')
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete availability for a date
  const handleDeleteAvailability = async (date: string) => {
    try {
      setLoading(true)
      setError('')
      
      // Use the new Supabase function to set slots to 0
      const { data, error } = await supabase.functions.invoke('update-tour-availability', {
        body: { 
          tourId, 
          date: date, 
          availableSlots: 0 
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Remove from local state
      setAvailability(prev => prev.filter(d => d.date !== date))
    } catch (err: any) {
      setError(err.message || 'Failed to delete availability')
      console.error('Delete error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading availability...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Tour Availability Management</h1>
              <p className="text-gray-600">{tourName} - Manage available slots by date</p>
            </div>
            <button
              onClick={loadAvailability}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
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

        {/* Calendar */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <span className="text-lg font-semibold text-gray-900">{getMonthYearString()}</span>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {getCalendarGrid().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-16"></div>
              }
              
              const { day: calendarDay, date, available, remainingSlots, hasData, isPastDate, inSeason } = day
              
              return (
                <button
                  key={date} 
                  type="button"
                  onClick={() => !isPastDate && inSeason && handleDateClick(date, remainingSlots)}
                  disabled={isPastDate || !inSeason}
                  className={`h-16 rounded text-sm font-medium transition-colors border ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isPastDate
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                      : !inSeason
                      ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed opacity-60'
                      : available
                      ? 'bg-green-50 text-green-900 border-green-200 hover:bg-green-100'
                      : hasData
                      ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-bold">{calendarDay}</div>
                  <div className="text-xs">
                    {isPastDate ? 'Past' : !inSeason ? 'Closed' : hasData ? `${remainingSlots} slots` : 'No data'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Edit Panel */}
        {isEditing && selectedDate && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Availability for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Slots
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxCapacity}
                  value={editingSlots}
                  onChange={(e) => setEditingSlots(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum capacity: {maxCapacity} people
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveAvailability}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                
                <button
                  onClick={() => handleDeleteAvailability(selectedDate)}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Delete Date
                </button>
                
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setSelectedDate(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-50 border border-green-200 rounded"></div>
              <span className="text-sm text-gray-700">Available (has slots)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-50 border border-red-200 rounded"></div>
              <span className="text-sm text-gray-700">Full booked (0 slots)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
              <span className="text-sm text-gray-700">No availability data</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 border border-gray-200 rounded opacity-60"></div>
              <span className="text-sm text-gray-700">Out of season (closed)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded opacity-60"></div>
              <span className="text-sm text-gray-700">Past dates (read-only)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAvailability
