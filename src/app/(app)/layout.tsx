import Link from "next/link";
import { requireUser, accessState } from "@/lib/auth";
import { LayoutDashboard, Briefcase, FileText, CreditCard, Settings } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const gate = accessState(user);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 md:pb-0">
      {/* Subscription Warning Banner */}
      {!gate.canWrite && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          {gate.reason}{" "}
          <Link href="/billing" className="font-semibold underline">
            Go to billing
          </Link>
        </div>
      )}
      
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        
        {/* Desktop Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="mb-6 text-xl font-bold text-blue-900">SparkChase</div>
          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-900"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-white py-2 md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center text-xs text-slate-600 hover:text-blue-800">
            <Icon className="h-5 w-5 mb-1" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}