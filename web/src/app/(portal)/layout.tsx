import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  // Banned users: sign out + bounce to /banned. Belt and suspenders alongside RLS.
  if (profile.is_banned) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/banned')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        profile={{
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          platform_role: profile.platform_role,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-[#F5F0E8]">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
