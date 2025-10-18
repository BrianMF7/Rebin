"use client";

import { InteractiveAvatarSystem } from "./InteractiveAvatarSystem";

export function AvatarTest() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-foreground">
          Avatar System Test
        </h1>

        <div className="space-y-8">
          <section
            id="hero"
            className="min-h-screen flex items-center justify-center bg-card/30 rounded-lg"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Hero Section
              </h2>
              <p className="text-muted-foreground">
                Scroll to see avatar messages change
              </p>
            </div>
          </section>

          <section
            id="mission"
            className="min-h-screen flex items-center justify-center bg-card/30 rounded-lg"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Mission Section
              </h2>
              <p className="text-muted-foreground">
                Avatar should show mission-related messages
              </p>
            </div>
          </section>

          <section
            id="features"
            className="min-h-screen flex items-center justify-center bg-card/30 rounded-lg"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Features Section
              </h2>
              <p className="text-muted-foreground">
                Avatar should show feature-related messages
              </p>
            </div>
          </section>

          <section
            id="impact"
            className="min-h-screen flex items-center justify-center bg-card/30 rounded-lg"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Impact Section
              </h2>
              <p className="text-muted-foreground">
                Avatar should show impact-related messages
              </p>
            </div>
          </section>
        </div>
      </div>

      <InteractiveAvatarSystem />
    </div>
  );
}
