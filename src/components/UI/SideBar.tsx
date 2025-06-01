"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import clsx from "clsx"

const navItems = [
  { href: "/history", label: "View Call History" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="bg-white border-r p-6 shadow-sm min-h-screen">
      <h2 className="text-xl font-semibold mb-6">Menu</h2>
      <nav className="space-y-3">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "block font-medium transition",
              pathname === href ? "text-blue-700 underline" : "text-blue-600 hover:underline"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
