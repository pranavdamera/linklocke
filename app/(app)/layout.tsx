import { Navbar } from '@/components/layout/Navbar'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Navbar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0 pt-[60px] md:pt-0">
        {children}
      </main>
    </div>
  )
}
