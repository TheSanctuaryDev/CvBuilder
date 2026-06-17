export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-serif text-center mb-8 text-amber-400">TheCvBuilder</h1>
        {children}
      </div>
    </div>
  )
}
