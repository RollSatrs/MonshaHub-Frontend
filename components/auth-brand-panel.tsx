export function AuthBrandPanel() {
  return (
    <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
      <div>
        <span className="text-2xl font-semibold tracking-tight">MonshaHub</span>
        <p className="mt-2 text-sm text-white/70">Система управления баней</p>
      </div>
      <div className="max-w-md border-l-4 border-white/45 pl-5">
        <p className="text-2xl leading-snug font-medium">
          Вся работа бани — помещения, время, товары и оплата — в одной системе.
        </p>
        <p className="mt-4 text-sm text-white/70">
          Быстрое рабочее место для администратора и кассира
        </p>
      </div>
      <p className="text-xs text-white/55">MonshaHub · рабочее место</p>
    </div>
  )
}
