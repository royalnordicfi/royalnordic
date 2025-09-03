import React, { useState, useEffect, useCallback } from 'react'
import { Save, RefreshCw } from 'lucide-react'
import { getTourAvailability, updateTourAvailability } from '../lib/api'
import type { TourDate } from '../lib/supabase'

interface AdminAvailabilityProps {
  tourId: number
  tourName: string
  maxCapacity: number
}

const AdminAvailability: React.FC<AdminAvailabilityProps> = ({ tourId, tourName, maxCapacity }) => {
  const [availability, setAvailability] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(true)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingSlots, setEditingSlots] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)

  // Load availability data
  useEffect(() => {
    loadAvailability()
  }, [tourId, loadAvailability])

  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTourAvailability(tourId)
      setAvailability(data)
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

    // Create calendar grid
    const grid = []
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(year, month, day).toISOString().split('T')[0]
      const dateData = monthDates.find(d => d.date === dateString)
      
      grid.push({
        day,
        date: dateString,
        available: dateData ? dateData.remaining_slots > 0 : false,
        remainingSlots: dateData?.remaining_slots || 0,
        hasData: !!dateData
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
      await updateTourAvailability(tourId, selectedDate, editingSlots)
      
      // Update local state
      const existingIndex = availability.findIndex(d => d.date === selectedDate)
      if (existingIndex >= 0) {
        // Update existing date
        const updated = [...availability]
        updated[existingIndex] = { ...updated[existingIndex], remaining_slots: editingSlots }
        setAvailability(updated)
      } else {
        // Add new date
        const newDate: TourDate = {
          id: Date.now(), // Temporary ID
          tour_id: tourId,
          date: selectedDate,
          remaining_slots: editingSlots,
          created_at: new Date().toISOString()
        }
        setAvailability(prev => [...prev, newDate])
      }
      
      setIsEditing(false)
      setSelectedDate(null)
    } catch (err) {
      setError('Failed to update availability')
      console.error('Save error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete availability for a date
  const handleDeleteAvailability = async (date: string) => {
    try {
      setLoading(true)
      await updateTourAvailability(tourId, date, 0)
      
      // Remove from local state
      setAvailability(prev => prev.filter(d => d.date !== date))
    } catch (err) {
      setError('Failed to delete availability')
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
              
              const { day: calendarDay, date, available, remainingSlots, hasData } = day
              
              return (
                <button
                  key={date} 
                  type="button"
                  onClick={() => handleDateClick(date, remainingSlots)}
                  className={`h-16 rounded text-sm font-medium transition-colors border ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white border-blue-600'
                      : available
                      ? 'bg-green-50 text-green-900 border-green-200 hover:bg-green-100'
                      : hasData
                      ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-bold">{calendarDay}</div>
                  <div className="text-xs">
                    {hasData ? `${remainingSlots} slots` : 'No data'}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAvailability
