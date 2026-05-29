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
      <div id="features"><FeaturesSection /></div>
      <div id="solutions"><SolutionsSection /></div>
      <StatsBanner />
      <div id="pricing"><PricingSection /></div>
      <div id="success-stories"><TestimonialsSection /></div>
      <CTASection />
    </div>
  );
};

export default Landing;