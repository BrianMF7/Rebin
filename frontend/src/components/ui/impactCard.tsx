import type React from "react"
import type { IconProps } from "../ui/icons"

interface ImpactCardProps {
  icon: React.ComponentType<IconProps>
  value: string
  label: string
  description: string
}

export function ImpactCard({ icon: Icon, value, label, description }: ImpactCardProps) {
  return (
    <div className="p-8 rounded-lg bg-card border border-border text-center space-y-4">
      <div className="inline-flex p-4 rounded-full bg-primary/10">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div>
        <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">{value}</div>
        <div className="text-lg font-semibold mb-2">{label}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
