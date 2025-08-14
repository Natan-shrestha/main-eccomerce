import React, { useEffect, useState } from 'react';
import { Users, Award, Leaf, Heart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// CountUp component for animated number counting
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({
  end,
  duration = 2000,
  suffix = '',
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 30); // update every ~30ms
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 30);

    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const teamMembers = [
  { name: '', role: 'Founder & Master Craftsman' },
  { name: '', role: 'Lead Designer' },
  { name: '', role: 'Customer Relations Manager' },
  { name: '', role: 'Coordinator' },
];

const testimonials = [
  {
    name: 'Jessica Williams',
    feedback:
      'FurnitureCraft transformed my living room with their beautiful, handcrafted pieces. Exceptional quality and service!',
  },
  {
    name: 'Michael Brown',
    feedback:
      'I love how sustainable and durable the furniture is. It’s rare to find such commitment to eco-friendly materials.',
  },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-warm py-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <h1 className="text-5xl font-bold text-foreground mb-6">About FurnitureCraft</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            For over two decades, we've been crafting exceptional furniture that transforms houses into homes. Our commitment to quality, sustainability, and timeless design has made us a trusted name in premium furniture.
          </p>
        </section>

        {/* Mission & Vision */}
        <section className="mb-20 max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-8">Our Mission & Vision</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
                <Star className="text-accent-deep" /> Mission
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To craft timeless, high-quality furniture with sustainable materials that enrich living spaces and build lasting memories.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
                <Award className="text-accent-deep" /> Vision
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                To be the world’s leading provider of sustainable luxury furniture, admired for craftsmanship and social responsibility.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <Card className="text-center p-6 bg-gradient-card border-border/50 shadow-card transition-transform hover:scale-105">
            <CardContent className="pt-6">
              <Award className="h-12 w-12 text-accent-deep mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Quality Craftsmanship</h3>
              <p className="text-muted-foreground">
                Every piece is meticulously crafted by skilled artisans using traditional techniques.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 bg-gradient-card border-border/50 shadow-card transition-transform hover:scale-105">
            <CardContent className="pt-6">
              <Leaf className="h-12 w-12 text-accent-deep mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Sustainable Materials</h3>
              <p className="text-muted-foreground">
                We source responsibly harvested wood and eco-friendly materials for all our furniture.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 bg-gradient-card border-border/50 shadow-card transition-transform hover:scale-105">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-accent-deep mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Customer First</h3>
              <p className="text-muted-foreground">Our dedicated team ensures every customer receives personalized service and support.</p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 bg-gradient-card border-border/50 shadow-card transition-transform hover:scale-105">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-accent-deep mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Passion for Design</h3>
              <p className="text-muted-foreground">We blend timeless aesthetics with modern functionality in every design.</p>
            </CardContent>
          </Card>
        </section>

        {/* Our Story */}
        <section className="max-w-4xl mx-auto text-center mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-8">Our Story</h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Founded in 2001 by master craftsman David Miller, FurnitureCraft began as a small workshop with a simple mission: to create beautiful, durable furniture that families could treasure for generations.
            </p>
            <p>
              What started as a passion project has grown into a renowned furniture company, but our core values remain unchanged. We still handpick every piece of wood, still test every joint, and still stand behind every product with our comprehensive warranty.
            </p>
            <p>
              Today, FurnitureCraft serves customers worldwide, but we never forget our roots. Every piece tells a story of dedication, craftsmanship, and the belief that great furniture can make any space feel like home.
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Meet the Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {teamMembers.map((member) => (
              <Card
                key={member.name}
                className="text-center p-6 bg-gradient-card border-border/50 shadow-card hover:shadow-lg transition-shadow cursor-default"
              >
                <CardContent>
                  <Users className="h-14 w-14 text-accent-deep mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-foreground">{member.name}</h4>
                  <p className="text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-4xl mx-auto mb-20 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-12">What Our Customers Say</h2>
          <div className="space-y-10">
            {testimonials.map(({ name, feedback }) => (
              <blockquote
                key={name}
                className="bg-gradient-card border-border/50 shadow-card rounded-lg p-8 text-muted-foreground italic"
              >
                <p className="mb-4 text-lg">"{feedback}"</p>
                <footer className="font-semibold text-foreground">— {name}</footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="grid md:grid-cols-4 gap-8 text-center mb-20">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              <CountUp end={20} suffix="+" />
            </div>
            <div className="text-muted-foreground">Years of Excellence</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              <CountUp end={50000} suffix="+" />
            </div>
            <div className="text-muted-foreground">Happy Customers</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              <CountUp end={500} suffix="+" />
            </div>
            <div className="text-muted-foreground">Unique Designs</div>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-primary">
              <CountUp end={99} suffix="%" />
            </div>
            <div className="text-muted-foreground">Satisfaction Rate</div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Ready to transform your space?</h2>
          <button className="px-8 py-4 bg-accent-deep text-white rounded-full text-lg font-semibold hover:bg-accent-deep/90 transition">
            Explore Our Collections
          </button>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
