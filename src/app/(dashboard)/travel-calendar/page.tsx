'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin, rectIntersection, CollisionDetection } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

// Custom collision detection that prioritizes day containers for dealer drops
const customCollisionDetection: CollisionDetection = (args) => {
  const { active } = args
  const activeId = active.id as string
  
  // For dealer drops, prioritize day containers
  if (activeId.startsWith('dealer-')) {
    // First check pointerWithin for precise targeting
    const pointerCollisions = pointerWithin(args)
    
    // Prefer day containers over stop cards
    const dayCollision = pointerCollisions.find(c => 
      (c.id as string).startsWith('day-')
    )
    if (dayCollision) return [dayCollision]
    
    // If no day container, return any collision (could be a stop card)
    if (pointerCollisions.length > 0) return pointerCollisions
    
    // Fallback to rect intersection
    return rectIntersection(args)
  }
  
  // For stop reordering, use rect intersection
  return rectIntersection(args)
}
import { startOfWeek, startOfMonth, endOfMonth, addDays, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Users, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { 
  CalendarHeader,
  type CalendarView,
  WeekView,
  MonthView,
  DealerSidebar 
} from '@/components/travel-calendar'
import { createClient } from '@/lib/supabase/client'
import type { TravelDay, TravelStop, Territory, Dealer, TravelStopStatus, TravelEventType } from '@/types'
import { 
  createTerritory, 
  updateTravelDay, 
  addTravelStop, 
  updateTravelStop, 
  deleteTravelStop,
  reorderStops,
  createVisitNote,
  createEventNote,
  addCalendarEvent
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
  const [view, setView] = useState<CalendarView>('week')

  // Calculate date ranges
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate])
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])

  // Load data
  const loadData = useCallback(async () => {
    const supabase = createClient()
    
    // Determine date range based on view
    const startStr = view === 'week' 
      ? format(weekStart, 'yyyy-MM-dd')
      : format(monthStart, 'yyyy-MM-dd')
    const endStr = view === 'week'
      ? format(addDays(weekStart, 4), 'yyyy-MM-dd') // Mon-Fri only
      : format(monthEnd, 'yyyy-MM-dd')

    // Fetch travel days for the range
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
  }, [view, weekStart, monthStart, monthEnd])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Get set of dealer IDs scheduled this week
  const scheduledDealerIds = useMemo(() => {
    const ids = new Set<string>()
    travelDays.forEach(day => {
      day.stops?.forEach(stop => {
        if (stop.dealer_id) {
          ids.add(stop.dealer_id)
        }
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

  const handleAddEvent = async (date: Date, event: {
    event_title: string
    event_type: TravelEventType
    is_all_day: boolean
    scheduled_time?: string
    end_time?: string
    location?: string
  }) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    await addCalendarEvent(dateStr, event)
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
    console.log('handleStopAddNote called with stop:', stop.id, 'note_id:', stop.note_id, 'dealer_id:', stop.dealer_id)
    if (stop.note_id) {
      // Navigate to existing note
      router.push(`/notes?noteId=${stop.note_id}`)
    } else {
      const travelDay = travelDays.find(d => d.stops?.some(s => s.id === stop.id))
      console.log('Found travelDay:', travelDay?.date, 'for stop:', stop.id)
      if (travelDay) {
        if (stop.dealer_id) {
          // Create dealer visit note
          console.log('Creating dealer visit note...')
          const result = await createVisitNote(stop.id, stop.dealer_id, travelDay.date)
          console.log('createVisitNote result:', result)
          if (result.success && result.noteId) {
            router.push(`/notes?noteId=${result.noteId}`)
          } else {
            console.error('Failed to create visit note:', result.error)
          }
        } else {
          // Create event note (no dealer)
          console.log('Creating event note...', stop.event_title)
          const result = await createEventNote(stop.id, stop.event_title || 'Event', travelDay.date)
          console.log('createEventNote result:', result)
          if (result.success && result.noteId) {
            router.push(`/notes?noteId=${result.noteId}`)
          } else {
            console.error('Failed to create event note:', result.error)
          }
        }
      } else {
        console.error('Could not find travel day for stop:', stop.id, 'Available days:', travelDays.map(d => ({ date: d.date, stopIds: d.stops?.map(s => s.id) })))
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

    // Dealer being dropped
    if (activeId.startsWith('dealer-')) {
      const dealerId = activeId.replace('dealer-', '')
      
      // Dropped on a day column
      if (overId.startsWith('day-')) {
        const dateStr = overId.replace('day-', '')
        await addTravelStop(dateStr, dealerId)
        loadData()
        return
      }
      
      // Dropped on a stop card - find which day that stop belongs to
      const targetDay = travelDays.find(d => d.stops?.some(s => s.id === overId))
      if (targetDay) {
        await addTravelStop(targetDay.date, dealerId)
        loadData()
        return
      }
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
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <CalendarHeader
              currentDate={currentDate}
              view={view}
              onDateChange={setCurrentDate}
              onViewChange={setView}
              onTodayClick={() => setCurrentDate(new Date())}
            />
            {/* Toggle sidebar button - desktop only, week view only */}
            {view === 'week' && (
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
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden px-4 sm:px-6 lg:px-8 pb-4">
          {view === 'week' ? (
            <>
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
                onAddEvent={handleAddEvent}
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
            </>
          ) : (
            /* Month view - click a day to switch to week view for that week */
            <MonthView
              currentDate={currentDate}
              travelDays={travelDays}
              onDayClick={(date) => {
                setCurrentDate(date)
                setView('week')
              }}
            />
          )}
        </div>
      </div>

      {/* Floating StopSheet Button */}
      <Link
        href="/stopsheet/new"
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all z-30"
      >
        <ClipboardCheck className="h-5 w-5" />
        <span className="font-medium">StopSheet</span>
      </Link>

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
