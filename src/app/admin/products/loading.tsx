export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]" dir="rtl">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-[#0B1E3D]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-[#0B1E3D]/5 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-[#0B1E3D]/5 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-[#C9A24B]/20 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#0B1E3D]/5 p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-[#0B1E3D]/5 rounded-lg" />
              </div>
              <div className="h-7 w-16 bg-[#0B1E3D]/5 rounded mb-2" />
              <div className="h-3 w-20 bg-[#0B1E3D]/5 rounded" />
            </div>
          ))}
        </div>

        {/* Toolbar Skeleton */}
        <div className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4 animate-pulse">
          <div className="h-10 bg-[#0B1E3D]/5 rounded-lg" />
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="lg:hidden space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#0B1E3D]/5 p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-[#0B1E3D]/5 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#0B1E3D]/5 rounded w-3/4" />
                  <div className="h-3 bg-[#0B1E3D]/5 rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-3 bg-[#0B1E3D]/5 rounded w-16" />
                    <div className="h-3 bg-[#0B1E3D]/5 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Skeleton */}
        <div className="hidden lg:block bg-white rounded-xl border border-[#0B1E3D]/5 overflow-hidden animate-pulse">
          <div className="h-10 bg-[#FAFAF8] border-b border-[#0B1E3D]/5" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-b border-[#0B1E3D]/5 flex items-center px-4 gap-4">
              <div className="h-12 w-12 bg-[#0B1E3D]/5 rounded-lg" />
              <div className="h-4 bg-[#0B1E3D]/5 rounded w-32" />
              <div className="h-4 bg-[#0B1E3D]/5 rounded w-20" />
              <div className="h-4 bg-[#0B1E3D]/5 rounded w-16" />
              <div className="h-4 bg-[#0B1E3D]/5 rounded w-12" />
              <div className="h-6 bg-[#0B1E3D]/5 rounded w-16" />
              <div className="h-4 bg-[#0B1E3D]/5 rounded w-20" />
              <div className="h-8 bg-[#0B1E3D]/5 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
