"use client"
import Link from "next/link"

import * as React from "react"
import {
  IconCalendarEvent,
  IconBuildingStore,
  IconHistory,
  IconLayoutGrid,
  IconDoor,
  IconMassage,
  IconPackage,
  IconSettings,
  IconUsers,
  IconBuildingCommunity,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
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
  { title: "Филиалы", url: "/branches", icon: IconBuildingCommunity },
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
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <Link
          href="/"
          className="flex min-h-24 items-center gap-3 bg-white px-5 text-foreground"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-subtle text-primary">
            <IconBuildingStore className="size-6" aria-hidden />
          </span>
          <span className="leading-none">
            <strong className="block text-xl tracking-tight">MonshaHub</strong>
            <span className="mt-1 block text-xs font-medium text-primary">
              Управление баней
            </span>
          </span>
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-3 py-3 text-xs leading-relaxed text-muted-foreground">
              <span className="block uppercase tracking-wider text-muted-foreground/75">
                Рабочее место
              </span>
              <strong className="block truncate text-sm text-foreground">
                {user.role === "OWNER" ? "Панель владельца" : "Касса"}
              </strong>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <NavMain label="Работа" items={MAIN_NAV} />
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
