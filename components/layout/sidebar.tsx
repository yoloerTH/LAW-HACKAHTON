'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Plus,
  MessageSquare,
  Scale,
} from 'lucide-react'

const nav = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Letters', href: '/letters', icon: FileText },
  { label: 'New Letter', href: '/letters/new', icon: Plus },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'AI Chat', href: '/chat', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#090e1a] border-r border-gold/8 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#070b14]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-foreground">
              LexFlow
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold/60">
              Engagement Suite
            </p>
          </div>
        </div>
      </div>

      <div className="gold-line mx-4 opacity-40" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03]'
              )}
            >
              <item.icon className={cn('w-4 h-4', isActive && 'text-gold')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gold/8">
        <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50">
          Hackathon 2026
        </div>
      </div>
    </aside>
  )
}
