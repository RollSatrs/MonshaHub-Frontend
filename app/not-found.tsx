import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm">404</p>
      <h1 className="text-2xl font-bold">Страница не найдена</h1>
      <p className="text-muted-foreground text-sm text-balance">
        Такой страницы не существует или она была перемещена.
      </p>
      <Button asChild>
        <Link href="/">На главную</Link>
      </Button>
    </div>
  )
}
