"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MessageSquare, Users, ChevronRight, BarChart3, Settings } from "lucide-react";
import { isAdminUser } from "@/lib/admin";
import { cn } from "@/lib/utils";
import Loading from "@/components/ui/loading";

const sidebarLinks = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    label: "Questions",
    href: "/admin/questions",
    icon: MessageSquare,
  },
  {
    label: "Company Users",
    href: "/admin/company-users",
    icon: Users,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const isAdmin = isAdminUser(session?.user?.role);

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [status, isAdmin, router]);

  if (status === "loading") return <Loading />;
  if (!isAdmin) return null;

  return (
    <div className="flex h-full">
      {/* Sidebar – hidden on mobile, visible md+ */}
      <aside className="hidden md:flex md:w-56 flex-col border-r border-border/40 bg-muted/20">
        <div className="px-4 py-5 border-b border-border/40">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Admin Panel
          </h2>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {sidebarLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
                {active && (
                  <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile breadcrumb nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-md">
        <div className="flex">
          {sidebarLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0">{children}</div>
    </div>
  );
}
