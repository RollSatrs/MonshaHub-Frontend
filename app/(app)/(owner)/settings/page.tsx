"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage } from "@/lib/get-error-message"
import {
  useOrganization,
  useUpdateOrganization,
} from "@/lib/queries/organization"
import type { Organization } from "@/lib/api/types"

export default function SettingsPage() {
  const org = useOrganization()
  return (
    <>
      <PageHeader
        title="Настройки"
        description="Общие сведения о вашей бане."
      />
      {org.isPending ? (
        <LoadingRows rows={2} />
      ) : org.isError ? (
        <ErrorState onRetry={() => org.refetch()} />
      ) : (
        <OrganizationForm org={org.data} />
      )}
    </>
  )
}

function OrganizationForm({ org }: { org: Organization }) {
  const update = useUpdateOrganization()
  const [name, setName] = useState(org.name)
  const [step, setStep] = useState<15 | 30 | 60>(
    org.timeStepMinutes as 15 | 30 | 60
  )
  const dirty = name.trim() !== org.name || step !== org.timeStepMinutes
  const valid = name.trim().length > 0

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await update.mutateAsync({ name: name.trim(), timeStepMinutes: step })
      toast.success("Сохранено")
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось сохранить"))
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Организация</CardTitle>
        <CardDescription>
          Валюта и часовой пояс пока фиксированы и не меняются.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Название бани</FieldLabel>
              <Input
                id="org-name"
                value={name}
                maxLength={255}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-step">
                Шаг оплачиваемого времени
              </FieldLabel>
              <Select
                value={String(step)}
                onValueChange={(v) => setStep(Number(v) as 15 | 30 | 60)}
              >
                <SelectTrigger id="org-step" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 минут</SelectItem>
                  <SelectItem value="30">30 минут</SelectItem>
                  <SelectItem value="60">60 минут (час)</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Кассир выбирает длительность посещения и продления кратно этому
                шагу. Применяется к новым посещениям — уже начатые не меняются.
              </FieldDescription>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="org-currency">Валюта</FieldLabel>
                <Input
                  id="org-currency"
                  value={org.currency}
                  disabled
                  readOnly
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="org-tz">Часовой пояс</FieldLabel>
                <Input id="org-tz" value={org.timezone} disabled readOnly />
              </Field>
            </div>
            <FieldDescription>
              От часового пояса зависят границы «сегодня» в отчётах, поэтому
              пока он не меняется.
            </FieldDescription>
          </FieldGroup>
          <Button type="submit" disabled={!valid || !dirty || update.isPending}>
            {update.isPending ? "Сохранение…" : "Сохранить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
