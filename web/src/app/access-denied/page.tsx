import Link from 'next/link'

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Access Denied</h1>
      <p className="text-zinc-500">You don&apos;t have permission to view this page.</p>
      <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-zinc-50 transition-colors">
        Back to Dashboard
      </Link>
    </div>
  )
}
