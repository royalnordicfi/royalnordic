import React from 'react';
import { Award, Shield, Heart, Users } from 'lucide-react';
import ImageSlideshow from './ImageSlideshow';

const About = () => {
  const values = [
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description: "We provide only the highest quality experiences with attention to every detail"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Safety First",
      description: "Your safety is our top priority with certified guides and premium equipment"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Passion",
      description: "Our love for the Arctic drives us to share its wonders with you"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Personal Service",
      description: "Small groups and personalized attention ensure an unforgettable experience"
    }
  ];

  // Slideshow images for the About section
  const aboutImages = [
    "/slideshow1.jpg",
    "/slideshow2.jpg", 
    "/slideshow3.jpg",
    "/slideshow4.jpg"
  ];

  return (
    <section 
      id="about" 
      className="py-20 bg-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-luxury font-bold mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            About Royal Nordic
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-clean">
            We're passionate Arctic enthusiasts dedicated to creating extraordinary Lapland experiences that connect travelers with the raw beauty and wonder of Finnish wilderness.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-luxury font-bold text-white mb-6">Our Story</h3>
            <div className="space-y-4 text-gray-300 text-lg leading-relaxed font-clean">
              <p>
                Born from a deep love for the Arctic and the magical Northern Lights, Royal Nordic emerged from a vision to share the authentic beauty of Finnish Lapland with fellow adventurers seeking genuine wilderness experiences.
              </p>
              <p>
                We're building our reputation as a premium tour operator in Finnish Lapland, offering intimate experiences that balance adventure with comfort, always respecting the pristine environment we're privileged to call home.
              </p>
              <p>
                Our carefully selected guides are not just drivers – they're passionate storytellers, skilled photographers, and Arctic specialists who ensure every moment of your journey is exceptional and authentic.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl shadow-2xl overflow-hidden">
              <ImageSlideshow 
                images={aboutImages}
                alt="Royal Nordic Lapland experiences"
                className="w-full h-80 object-cover"
                interval={5000}
                showCounter={false}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;