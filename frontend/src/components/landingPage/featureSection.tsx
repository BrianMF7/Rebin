import { Icons } from "../ui/icons"
import { SectionHeader } from "../ui/sectionHeader"
import { FeatureCard } from "../ui/featureCard"

export function FeaturesSection() {
  const features = [
    {
      icon: Icons.camera,
      title: "Instant Recognition",
      description: "Snap a photo and get instant classification results powered by advanced AI",
      color: "text-primary",
    },
    {
      icon: Icons.sparkles,
      title: "Smart Suggestions",
      description: "Receive personalized tips on how to properly dispose or recycle each item",
      color: "text-secondary",
    },
    {
      icon: Icons.trendingUp,
      title: "Track Progress",
      description: "Monitor your environmental impact with detailed analytics and insights",
      color: "text-primary",
    },
    {
      icon: Icons.users,
      title: "Community Driven",
      description: "Join a global community committed to making sustainable choices",
      color: "text-secondary",
    },
  ]

  return (
    <section id="features" className="relative py-20 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Powerful"
          highlight="Features"
          description="Everything you need to make informed decisions about waste sorting"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
