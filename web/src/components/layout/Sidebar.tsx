'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShieldAlert,
  Building2,
  Users,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type NavProfile = {
  display_name: string
  avatar_url: string | null
  platform_role: string
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'moderator', 'standard'] },
  { href: '/moderation', label: 'Moderation', icon: ShieldAlert, roles: ['super_admin', 'moderator'] },
  { href: '/orgs', label: 'Organizations', icon: Building2, roles: ['super_admin', 'moderator', 'standard'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['super_admin'] },
]

export function Sidebar({ profile }: { profile: NavProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleLinks = NAV_LINKS.filter((l) => l.roles.includes(profile.platform_role))

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = profile.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full w-60 border-r border-[#E5DDD4] bg-[#FAF7F2]">
      <div className="px-5 py-5 border-b border-[#E5DDD4]">
        <div className="lv-wordmark">
          <span className="life">Life</span><span className="vine">Vine</span>
        </div>
        <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-[#78716C] mt-1">Admin Portal</p>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {visibleLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            (href === '/dashboard' && pathname === href) ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors',
                isActive
                  ? 'bg-[#2D6A4F]/10 text-[#2D6A4F]'
                  : 'text-[#57534E] hover:bg-white hover:text-[#1C1917]'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#2D6A4F]' : 'text-[#78716C]')} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-[#E5DDD4]">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 w-full hover:bg-white rounded-lg px-2 py-2 transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs bg-[#2D6A4F]/10 text-[#2D6A4F] font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-semibold text-[#1C1917] truncate">{profile.display_name}</p>
              <p className="text-[11px] text-[#78716C] capitalize truncate">{profile.platform_role.replace('_', ' ')}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
