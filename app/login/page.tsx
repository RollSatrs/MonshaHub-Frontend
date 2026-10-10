import {
  IconBuildingStore,
  IconHeadset,
  IconMenu2,
  IconRefresh,
  IconSettings,
} from "@tabler/icons-react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full overflow-hidden bg-primary text-primary-foreground">
      <aside className="hidden w-[204px] shrink-0 flex-col bg-white text-foreground shadow-xl md:flex xl:w-[230px]">
        <div className="flex h-56 flex-col items-center justify-center gap-3 px-5 text-center">
          <span className="flex size-20 items-center justify-center rounded-[28px] bg-primary-subtle text-primary shadow-sm">
            <IconBuildingStore className="size-10" aria-hidden />
          </span>
          <div>
            <p className="text-2xl font-bold tracking-tight text-primary">
              MonshaHub
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Система управления баней
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-foreground px-4 py-6 text-white">
          <div className="text-[11px] leading-relaxed text-white/55">
            <p>MonshaHub Front</p>
            <p>Локальное рабочее место</p>
            <p>Облачная синхронизация</p>
          </div>

          <dl className="mt-14 space-y-8 text-sm">
            <div>
              <dt className="text-xs text-white/55">Организация</dt>
              <dd className="mt-1 font-semibold">MonshaHub Demo</dd>
            </div>
            <div>
              <dt className="text-xs text-white/55">Рабочее место</dt>
              <dd className="mt-1 font-semibold">Сенсорный терминал</dd>
            </div>
          </dl>

          <div className="mt-auto text-xs leading-relaxed text-white/55">
            <p className="font-semibold text-white">Поддержка MonshaHub</p>
            <p>Администратор системы</p>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-svh min-w-0 flex-1 flex-col overflow-y-auto">
        <details className="group absolute top-3 right-3 z-10 w-44 text-sm">
          <summary className="flex h-11 cursor-pointer list-none items-center gap-2 bg-white/12 px-3 font-semibold text-white select-none hover:bg-white/18 [&::-webkit-details-marker]:hidden">
            <IconMenu2 className="size-5" aria-hidden />
            МЕНЮ
          </summary>
          <div className="border-t border-white/15 bg-black/20 shadow-xl backdrop-blur-sm">
            <div className="flex min-h-11 items-center gap-2 px-3 text-white/75">
              <IconRefresh className="size-4" aria-hidden />
              Синхронизация
            </div>
            <div className="flex min-h-11 items-center gap-2 px-3 text-white/75">
              <IconSettings className="size-4" aria-hidden />
              Настройки
            </div>
            <div className="flex min-h-11 items-center gap-2 px-3 text-white/75">
              <IconHeadset className="size-4" aria-hidden />
              Поддержка
            </div>
          </div>
        </details>

        <div className="flex flex-1 items-center justify-center px-4 pt-20 pb-8 sm:px-8">
          <LoginForm className="w-full max-w-[356px]" />
        </div>

        <div className="px-4 pb-6 text-center text-xs text-white/60">
          <p className="font-semibold tracking-wide text-white/85 uppercase">
            Техническая поддержка MonshaHub
          </p>
          <p className="mt-1">Обратитесь к администратору вашей организации</p>
        </div>
      </main>
    </div>
  )
}
