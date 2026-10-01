"use client"
import Link from "next/link"

import * as React from "react"
import {
  IconCalendarEvent,
  IconHistory,
  IconLayoutGrid,
  IconDoor,
  IconFlame,
  IconMassage,
  IconPackage,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useCurrentUser } from "@/hooks/use-current-user"

/** Пункты меню по ролям. Новые разделы добавляются вместе с их страницами. */
const MAIN_NAV = [
  { title: "Баня сейчас", url: "/", icon: IconLayoutGrid },
  { title: "Брони", url: "/bookings", icon: IconCalendarEvent },
  { title: "История", url: "/history", icon: IconHistory },
]

const OWNER_SETTINGS_NAV = [
  { title: "Помещения", url: "/rooms", icon: IconDoor },
  { title: "Товары", url: "/products", icon: IconPackage },
  { title: "Услуги", url: "/services", icon: IconMassage },
  { title: "Сотрудники", url: "/staff", icon: IconUsers },
  { title: "Настройки", url: "/settings", icon: IconSettings },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useCurrentUser()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconFlame className="text-primary !size-5" />
                <span className="text-base font-semibold">MonshaHub</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={MAIN_NAV} />
        {user.role === "OWNER" && (
          <NavMain label="Настройки бани" items={OWNER_SETTINGS_NAV} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
