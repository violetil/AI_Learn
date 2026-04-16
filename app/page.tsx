import { getSessionUser } from "@/lib/auth";
import { LandingAiShowcase } from "@/components/landing/landing-ai-showcase";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";

export default async function Home() {
  const user = await getSessionUser();
  const isLoggedIn = Boolean(user);

  return (
    <div className="min-h-dvh bg-white text-[rgba(0,0,0,0.95)]">
      <LandingHeader isLoggedIn={isLoggedIn} />
      <LandingHero isLoggedIn={isLoggedIn} />
      <LandingFeatures />
      <LandingAiShowcase />
      <LandingHowItWorks />
      <LandingCta isLoggedIn={isLoggedIn} />
      <LandingFooter />
    </div>
  );
}
