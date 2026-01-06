'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { startOfWeek, addDays, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { 
  CalendarHeader, 
  WeekView, 
  DealerSidebar 
} from '@/components/travel-calendar'
import { createClient } from '@/lib/supabase/client'
import type { TravelDay, TravelStop, Territory, Dealer, TravelStopStatus } from '@/types'
import { 
  createTerritory, 
  updateTravelDay, 
  addTravelStop, 
  updateTravelStop, 
  deleteTravelStop,
  reorderStops,
  createVisitNote
} from './actions'

export default function TravelCalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [travelDays, setTravelDays] = useState<TravelDay[]>([])
  const [territories, setTerritories] = useState<Territory[]>([])
  const [dealers, setDealers] = useState<Dealer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)

  // Calculate week range
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])

  // Load data
  const loadData = useCallback(async () => {
    const supabase = createClient()
    const startStr = format(weekStart, 'yyyy-MM-dd')
    const endStr = format(addDays(weekStart, 4), 'yyyy-MM-dd') // Mon-Fri only

    // Fetch travel days for this week
    const { data: travelData } = await supabase
      .from('travel_days')
      .select(`
        *,
        territory:territories(*),
        stops:travel_stops(
          *,
          dealer:dealers(id, dealer_name, account_number)
        )
      `)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date')

    if (travelData) {
      const sorted = travelData.map(day => ({
        ...day,
        stops: day.stops?.sort((a: TravelStop, b: TravelStop) => a.sort_order - b.sort_order) || []
      })) as TravelDay[]
      setTravelDays(sorted)
    }

    // Fetch territories
    const { data: terrData } = await supabase
      .from('territories')
      .select('*')
      .order('name')

    if (terrData) {
      setTerritories(terrData as Territory[])
    }

    // Fetch dealers
    const { data: dealerData } = await supabase
      .from('dealers')
      .select('*')
      .order('dealer_name')

    if (dealerData) {
      setDealers(dealerData as Dealer[])
    }

    setIsLoading(false)
  }, [weekStart])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Get set of dealer IDs scheduled this week
  const scheduledDealerIds = useMemo(() => {
    const ids = new Set<string>()
    travelDays.forEach(day => {
      day.stops?.forEach(stop => {
        ids.add(stop.dealer_id)
      })
    })
    return ids
  }, [travelDays])

  // Handlers
  const handleTerritoryChange = async (date: Date, territoryId: string | null) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    await updateTravelDay(dateStr, { territory_id: territoryId })
    loadData()
  }

  const handleCreateTerritory = async (name: string) => {
    await createTerritory(name)
    loadData()
  }

  const handleAddDealer = async (date: Date, dealerId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    await addTravelStop(dateStr, dealerId)
    loadData()
  }

  const handleStopStatusChange = async (stopId: string, status: TravelStopStatus) => {
    await updateTravelStop(stopId, { status })
    loadData()
  }

  const handleStopTimeChange = async (stopId: string, time: string) => {
    await updateTravelStop(stopId, { scheduled_time: time })
    loadData()
  }

  const handleStopDelete = async (stopId: string) => {
    await deleteTravelStop(stopId)
    loadData()
  }

  const handleStopAddNote = async (stop: TravelStop) => {
    if (stop.note_id) {
      // Navigate to existing note
      router.push(`/notes?highlight=${stop.note_id}`)
    } else {
      // Create new note and navigate
      const travelDay = travelDays.find(d => d.stops?.some(s => s.id === stop.id))
      if (travelDay) {
        const result = await createVisitNote(stop.id, stop.dealer_id, travelDay.date)
        if (result.success && result.noteId) {
          router.push(`/notes?highlight=${result.noteId}`)
        }
      }
    }
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Dealer dropped on a day
    if (activeId.startsWith('dealer-') && overId.startsWith('day-')) {
      const dealerId = activeId.replace('dealer-', '')
      const dateStr = overId.replace('day-', '')
      await addTravelStop(dateStr, dealerId)
      loadData()
      return
    }

    // Stop reordering within same day
    if (!activeId.startsWith('dealer-') && !overId.startsWith('dealer-')) {
      // Find which day contains the active stop
      const activeDay = travelDays.find(d => d.stops?.some(s => s.id === activeId))
      
      if (activeDay && activeDay.stops) {
        const oldIndex = activeDay.stops.findIndex(s => s.id === activeId)
        const newIndex = activeDay.stops.findIndex(s => s.id === overId)
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newOrder = arrayMove(activeDay.stops.map(s => s.id), oldIndex, newIndex)
          await reorderStops(activeDay.id, newOrder)
          loadData()
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-96 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <CalendarHeader
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onTodayClick={() => setCurrentDate(new Date())}
            />
            {/* Toggle sidebar button - desktop only */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                showSidebar
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4" />
              {showSidebar ? 'Hide' : 'Show'} Drag & Drop
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden px-4 sm:px-6 lg:px-8 pb-4">
          {/* Week view - takes full width when sidebar hidden */}
          <WeekView
            currentDate={currentDate}
            travelDays={travelDays}
            territories={territories}
            dealers={dealers}
            scheduledDealerIds={scheduledDealerIds}
            onTerritoryChange={handleTerritoryChange}
            onCreateTerritory={handleCreateTerritory}
            onAddDealer={handleAddDealer}
            onStopStatusChange={handleStopStatusChange}
            onStopTimeChange={handleStopTimeChange}
            onStopDelete={handleStopDelete}
            onStopAddNote={handleStopAddNote}
            enableDragDrop={showSidebar}
          />

          {/* Dealer sidebar - collapsible, desktop only */}
          <DealerSidebar
            dealers={dealers}
            scheduledDealerIds={scheduledDealerIds}
            isOpen={showSidebar}
            onToggle={() => setShowSidebar(!showSidebar)}
          />
        </div>
      </div>

      {/* Drag overlay for visual feedback */}
      <DragOverlay>
        {activeDragId && activeDragId.startsWith('dealer-') && (
          <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-blue-900">
              {dealers.find(d => `dealer-${d.id}` === activeDragId)?.dealer_name}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
