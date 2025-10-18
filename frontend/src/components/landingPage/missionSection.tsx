import { MissionCard } from "../ui/missionCard"

export function MissionSection() {
  const goals = [
    {
      title: "Zero Waste",
      description: "Working towards a future where nothing goes to landfills",
      color: "text-secondary",
    },
    {
      title: "100% Green",
      description: "Powered by renewable energy and sustainable practices",
      color: "text-primary",
    },
  ]

  return (
    <section id="mission" className="relative py-20 sm:py-32">
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-balance">
            Our <span className="text-primary">Mission</span>
          </h2>
          <p className="text-lg sm:text-xl text-white/90 text-pretty leading-relaxed">
            We believe in a world where every piece of waste finds its right place. Through cutting-edge AI technology
            and community engagement, we're making sustainable living accessible to everyone.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 pt-8">
            {goals.map((goal, index) => (
              <MissionCard key={index} title={goal.title} description={goal.description} color={goal.color} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}