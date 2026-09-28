import { AuthBrandPanel } from "@/components/auth-brand-panel"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="grid w-full min-h-screen overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <AuthBrandPanel />
    </div>
  )
}
