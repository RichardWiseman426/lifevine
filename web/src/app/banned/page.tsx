export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4">
      <div className="max-w-md text-center">
        <div className="lv-wordmark text-3xl mb-6 inline-block">
          <span className="life">Life</span><span className="vine">Vine</span>
        </div>
        <div className="bg-white border border-[#E5DDD4] rounded-2xl p-8 shadow-[0_3px_12px_rgba(0,0,0,0.05)]">
          <h1 className="text-xl font-bold text-[#1C1917] mb-2">Account Suspended</h1>
          <p className="text-sm text-[#78716C] leading-relaxed">
            Your account has been suspended and you no longer have access to LifeVine.
            If you believe this is a mistake, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
