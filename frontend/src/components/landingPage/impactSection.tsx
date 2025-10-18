import { Icons } from "../ui/icons"
import { SectionHeader } from "../ui/sectionHeader"
import { ImpactCard } from "../ui/impactCard"

export function ImpactSection() {
  const impacts = [
    {
      icon: Icons.leaf,
      value: "2.5M kg",
      label: "Waste Diverted",
      description: "From landfills to proper recycling",
    },
    {
      icon: Icons.droplets,
      value: "500K L",
      label: "Water Saved",
      description: "Through proper recycling practices",
    },
    {
      icon: Icons.wind,
      value: "1.2M kg",
      label: "CO₂ Reduced",
      description: "Carbon emissions prevented",
    },
    {
      icon: Icons.treePine,
      value: "50K+",
      label: "Trees Saved",
      description: "Equivalent environmental impact",
    },
  ]

  return (
    <section id="impact" className="relative py-20 sm:py-32 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Real"
          highlight="Impact"
          description="Together, we're making a measurable difference for our planet"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {impacts.map((impact, index) => (
            <ImpactCard
              key={index}
              icon={impact.icon}
              value={impact.value}
              label={impact.label}
              description={impact.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}