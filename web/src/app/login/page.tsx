import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="lv-wordmark text-3xl mb-2">
            <span className="life">Life</span><span className="vine">Vine</span>
          </div>
          <p className="text-[13px] uppercase tracking-[0.15em] font-bold text-[#78716C]">Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5DDD4] p-7 shadow-[0_3px_12px_rgba(0,0,0,0.05)]">
          <h1 className="text-xl font-bold text-[#1C1917] mb-1">Welcome back</h1>
          <p className="text-sm text-[#78716C] mb-6">Sign in to manage your platform</p>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-[#78716C] mt-6 italic">Connect. Serve. Belong.</p>
      </div>
    </div>
  )
}
