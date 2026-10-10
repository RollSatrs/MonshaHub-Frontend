"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  label,
  items,
}: {
  label?: string
  items: { title: string; url: string; icon?: Icon }[]
}) {
  const pathname = usePathname()
  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="h-10 rounded-lg border-l-3 border-transparent px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-primary"
                isActive={
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url)
                }
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
