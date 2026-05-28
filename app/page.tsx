import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Skull, Link2, MapPin, Swords, Users } from 'lucide-react'

export default async function HomePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <span>⚔️</span> Pokémon Black & White Linklocke
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-foreground">Unova</span>{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Linklocke
            </span>{' '}
            <span className="text-foreground">Tracker</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Track your 3-player Linklocke run across Unova. Log encounters, survive together, mourn together.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-left mt-8">
            {[
              { icon: <Link2 className="h-5 w-5 text-blue-400" />,  title: 'Linked Deaths',     desc: 'One dies, all die. Automatically.' },
              { icon: <MapPin className="h-5 w-5 text-green-400" />, title: 'Route Tracker',     desc: 'All Unova BW locations in order.' },
              { icon: <Users className="h-5 w-5 text-purple-400" />, title: '3-Player Support',  desc: 'Three linked runs, one shared tracker.' },
              { icon: <Skull className="h-5 w-5 text-red-400" />,    title: 'Graveyard',         desc: 'Honor the fallen with full death logs.' },
              { icon: <Shield className="h-5 w-5 text-yellow-400" />, title: 'Live Updates',      desc: 'Realtime sync across all devices.' },
              { icon: <Swords className="h-5 w-5 text-orange-400" />, title: 'House Rules',       desc: 'Dupes clause, shiny clause & more.' },
            ].map(f => (
              <div key={f.title} className="p-3 rounded-xl bg-card/40 border border-border/40">
                <div className="flex items-center gap-2 mb-1.5">{f.icon}<span className="font-semibold text-sm">{f.title}</span></div>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="px-8">
              <Link href="/login">Start your run</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Dark mode. Mobile-first. No spoilers.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground/40 border-t border-border/20">
        Linklocke Tracker · Unova · Not affiliated with Nintendo or Game Freak
      </footer>
    </div>
  )
}
