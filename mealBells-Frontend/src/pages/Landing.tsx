import Hero from "../components/homepage/Hero";
import FeaturesSection from "../components/homepage/FeaturesSection";
import SolutionsSection from "../components/homepage/SolutionsSection";
import StatsBanner from "../components/homepage/StatsBanner";
import PricingSection from "../components/homepage/PricingSection";
import TestimonialsSection from "../components/homepage/TestimonialsSection";
import CTASection from "../components/homepage/CTASection";

const Landing = () => {
  return (
    <div className="bg-[#F9F9F9]">
      <Hero />
      <FeaturesSection />
      <SolutionsSection />
      <StatsBanner />
      <PricingSection/>
      <TestimonialsSection/>
      <CTASection/>
    </div>
  );
};

export default Landing;
