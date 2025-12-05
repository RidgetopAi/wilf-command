import { Loader2 } from 'lucide-react'

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
       <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  )
}

export function ProductMixGridSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="border rounded-lg p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex space-x-4">
             <Skeleton className="h-8 w-32" />
             <Skeleton className="h-8 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
