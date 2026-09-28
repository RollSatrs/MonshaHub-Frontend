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
  const dirty = name.trim() !== org.name
  const valid = name.trim().length > 0

  async function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      await update.mutateAsync({ name: name.trim() })
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
