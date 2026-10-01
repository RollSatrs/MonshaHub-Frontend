"use client"

import { use } from "react"
import { VisitPageView } from "@/components/visit/visit-page-view"

export default function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <VisitPageView visitId={Number(id)} />
}
