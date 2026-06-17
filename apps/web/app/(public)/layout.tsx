// apps/web/app/(public)/layout.tsx
import PublicNav from '@/components/PublicNav'
import Footer from '@/components/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
