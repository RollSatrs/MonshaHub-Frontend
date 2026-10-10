"use client"

import { useState } from "react"
import {
  IconBuildingStore,
  IconDeviceDesktop,
  IconPlus,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { ActiveBadge } from "@/components/active-badge"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingRows } from "@/components/state-views"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { setWorkplaceToken } from "@/lib/branch-context"
import { getErrorMessage } from "@/lib/get-error-message"
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
} from "@/lib/queries/branches"
import {
  useCreateWorkplace,
  useUpdateWorkplace,
  useWorkplaces,
} from "@/lib/queries/workplaces"

export default function BranchesPage() {
  const branches = useBranches()
  const workplaces = useWorkplaces()
  const createBranch = useCreateBranch()
  const updateBranch = useUpdateBranch()
  const createWorkplace = useCreateWorkplace()
  const updateWorkplace = useUpdateWorkplace()
  const [branchName, setBranchName] = useState("")
  const [address, setAddress] = useState("")
  const [workplaceName, setWorkplaceName] = useState("")
  const [workplaceBranchId, setWorkplaceBranchId] = useState("")
  const [activationToken, setActivationToken] = useState<string | null>(null)

  const selectedWorkplaceBranchId =
    workplaceBranchId ||
    String(branches.data?.find((branch) => branch.active)?.id ?? "")

  async function addBranch(event: React.FormEvent) {
    event.preventDefault()
    if (!branchName.trim()) return
    try {
      await createBranch.mutateAsync({
        name: branchName.trim(),
        address: address.trim() || undefined,
      })
      setBranchName("")
      setAddress("")
      toast.success("Филиал создан")
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать филиал"))
    }
  }

  async function addWorkplace(event: React.FormEvent) {
    event.preventDefault()
    if (!workplaceName.trim() || !selectedWorkplaceBranchId) return
    try {
      const created = await createWorkplace.mutateAsync({
        name: workplaceName.trim(),
        branchId: Number(selectedWorkplaceBranchId),
      })
      setActivationToken(created.activationToken)
      setWorkplaceName("")
      toast.success("Рабочее место создано")
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось создать рабочее место"))
    }
  }

  const loading = branches.isPending || workplaces.isPending
  const error = branches.isError || workplaces.isError

  return (
    <>
      <PageHeader
        title="Филиалы и кассы"
        description="Разделяйте помещения, сотрудников и операции по физическим филиалам."
      />

      {loading ? (
        <LoadingRows />
      ) : error ? (
        <ErrorState
          onRetry={() => {
            branches.refetch()
            workplaces.refetch()
          }}
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconBuildingStore className="size-5 text-primary" /> Филиалы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addBranch} className="grid gap-3 sm:grid-cols-2">
                <Input
                  aria-label="Название филиала"
                  placeholder="Название филиала"
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  required
                />
                <Input
                  aria-label="Адрес филиала"
                  placeholder="Адрес"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                />
                <Button
                  className="sm:col-span-2"
                  disabled={createBranch.isPending}
                >
                  <IconPlus /> Добавить филиал
                </Button>
              </form>

              <div className="space-y-2">
                {branches.data?.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex min-h-16 items-center gap-3 rounded-xl border bg-background p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{branch.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {branch.address || "Адрес не указан"}
                      </p>
                    </div>
                    <ActiveBadge active={branch.active} />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateBranch.isPending}
                      onClick={() =>
                        updateBranch.mutate({
                          id: branch.id,
                          input: { active: !branch.active },
                        })
                      }
                    >
                      {branch.active ? "В архив" : "Восстановить"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDeviceDesktop className="size-5 text-primary" /> Рабочие
                места
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addWorkplace} className="space-y-3">
                <Input
                  aria-label="Название рабочего места"
                  placeholder="Например, Касса №1"
                  value={workplaceName}
                  onChange={(event) => setWorkplaceName(event.target.value)}
                  required
                />
                <Select
                  value={selectedWorkplaceBranchId}
                  onValueChange={setWorkplaceBranchId}
                >
                  <SelectTrigger className="min-h-12 w-full">
                    <SelectValue placeholder="Выберите филиал" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.data
                      ?.filter((branch) => branch.active)
                      .map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" disabled={createWorkplace.isPending}>
                  <IconPlus /> Создать рабочее место
                </Button>
              </form>

              {activationToken && (
                <div className="rounded-xl bg-primary-subtle p-4 text-sm">
                  <p className="font-semibold text-primary">Токен создан</p>
                  <p className="mt-1 text-muted-foreground">
                    Нажмите кнопку на том моноблоке, который хотите привязать.
                  </p>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    onClick={() => {
                      setWorkplaceToken(activationToken)
                      setActivationToken(null)
                      toast.success("Этот моноблок привязан")
                    }}
                  >
                    Привязать этот моноблок
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {workplaces.data?.map((workplace) => (
                  <div
                    key={workplace.id}
                    className="grid min-h-16 gap-3 rounded-xl border bg-background p-3 sm:grid-cols-[1fr_11rem_auto_auto] sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{workplace.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {workplace.branchName}
                      </p>
                    </div>
                    <Select
                      value={String(workplace.branchId)}
                      onValueChange={async (value) => {
                        try {
                          await updateWorkplace.mutateAsync({
                            id: workplace.id,
                            input: { branchId: Number(value) },
                          })
                          toast.success("Рабочее место перенесено")
                        } catch (error) {
                          toast.error(
                            getErrorMessage(error, "Не удалось изменить филиал")
                          )
                        }
                      }}
                    >
                      <SelectTrigger className="min-h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.data
                          ?.filter((branch) => branch.active)
                          .map((branch) => (
                            <SelectItem
                              key={branch.id}
                              value={String(branch.id)}
                            >
                              {branch.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <ActiveBadge active={workplace.active} />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateWorkplace.isPending}
                      onClick={() =>
                        updateWorkplace.mutate({
                          id: workplace.id,
                          input: { active: !workplace.active },
                        })
                      }
                    >
                      {workplace.active ? "Отключить" : "Включить"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
