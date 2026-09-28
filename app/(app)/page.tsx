"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"

const ROLE_LABEL = { OWNER: "Владелец", CASHIER: "Кассир" } as const

export default function HomePage() {
  const user = useCurrentUser()
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-xl">Здравствуйте, {user.fullname}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div>
          <Badge variant="secondary" className="rounded-full">
            {ROLE_LABEL[user.role]}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {user.role === "CASHIER"
            ? "Экран кассы с помещениями появится в следующей фазе."
            : "Кабинет владельца и экран кассы появятся в следующих фазах."}
        </p>
      </CardContent>
    </Card>
  )
}
