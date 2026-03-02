import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Check,
  Scale,
  Calendar,
  FileText,
  Users,
  Shield,
  Star,
  Zap,
  TrendingUp,
  Clock,
  Award,
  HeartHandshake,
  Gavel,
  DollarSign,
  Bell,
  Settings,
  BarChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/Navbar";

// Importing images from assets
import Carousel1 from "../assets/images/Carousel 1.png";
import Carousel2 from "../assets/images/Carousel 2.jpg";
import Carousel3 from "../assets/images/Carousel 3.jpg";
import Carousel4 from "../assets/images/Carousel 4.jpg";
import Carousel5 from "../assets/images/Carousel 5.jpg";

const features = [
  {
    icon: Gavel,
    title: "Complete Case Management",
    description:
      "Organize, track, and manage all your legal cases with powerful search, filtering, and detailed case tracking capabilities.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar & Scheduling",
    description:
      "Never miss a court date, client meeting, or deadline with integrated calendar, reminders, and automated scheduling.",
  },
  {
    icon: FileText,
    title: "Secure Document Management",
    description:
      "Upload, store, organize, and share legal documents securely with clients and colleagues. Full document version control.",
  },
  {
    icon: Users,
    title: "Client Portal & Communication",
    description:
      "Give clients 24/7 access to their case information, documents, and communication history through a secure portal.",
  },
  {
    icon: DollarSign,
    title: "Fee & Billing Management",
    description:
      "Track time, manage billing, process payments, and generate invoices with automated fee calculations and reporting.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed with intelligent notifications for deadlines, court dates, client communications, and case updates.",
  },
  {
    icon: BarChart,
    title: "Analytics & Reporting",
    description:
      "Get insights into your practice with detailed reports, analytics dashboards, and performance metrics.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description:
      "Enterprise-grade security with encryption, compliance monitoring, and adherence to legal industry standards.",
  },
  {
    icon: Settings,
    title: "Customizable Workflows",
    description:
      "Adapt the system to your practice with customizable workflows, templates, and automated processes.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Boost Productivity",
    description:
      "Streamline workflows and automate routine tasks to focus on what matters most.",
    stat: "40% faster",
  },
  {
    icon: TrendingUp,
    title: "Increase Revenue",
    description:
      "Better time tracking and billing management leads to improved profitability.",
    stat: "25% increase",
  },
  {
    icon: Clock,
    title: "Save Time",
    description:
      "Reduce administrative overhead with intelligent automation and organization.",
    stat: "10 hrs/week",
  },
  {
    icon: Award,
    title: "Professional Excellence",
    description:
      "Deliver exceptional client service with organized case management.",
    stat: "95% satisfaction",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Partner at Johnson & Associates",
    content:
      "Lawyer's Case Diary transformed our practice. We're more organized and efficient than ever before.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Solo Practitioner",
    content:
      "The integrated billing and case management features alone have saved me countless hours every week.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Managing Partner at Rodriguez Law",
    content:
      "The analytics and client portal features give us insights we never had before. Highly recommended!",
    rating: 5,
  },
];

const carouselImages = [
  {
    title: "Modern Dashboard",
    description: "Comprehensive overview of your practice at a glance",
    image: Carousel1,
    alt: "Dashboard showing case overview and analytics",
  },
  {
    title: "Case Management",
    description: "Organize and track all your legal cases efficiently",
    image: Carousel2,
    alt: "Case management interface with case details",
  },
  {
    title: "Client Communication",
    description: "Stay connected with clients through secure messaging",
    image: Carousel3,
    alt: "Client communication portal interface",
  },
  {
    title: "Document Storage",
    description: "Secure document management with easy access",
    image: Carousel4,
    alt: "Document management system interface",
  },
  {
    title: "Billing & Invoicing",
    description: "Professional billing and payment processing",
    image: Carousel5,
    alt: "Billing and invoicing dashboard",
  },
];

const allFeatures = [
  "Complete Case Management",
  "Hearing Tracking & Scheduling",
  "Professional Fee Management",
  "Automated Daily Dairy Reports",
  "Secure PIN-based Financial Vault",
  "Client & Contact Management",
  "Instant Invoice Generation",
];

export const Landing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 25000); // Auto-rotate every 25 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-background border-b border-border/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Award className="w-4 h-4 mr-2" />
            Trusted by 10,000+ Legal Professionals
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-outfit text-foreground mb-6 tracking-tight leading-tight">
            Transform Your <br />
            <span className="text-primary italic">Legal Practice</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed font-inter">
            Experience the next generation of <strong>Legal Practice Management</strong>.
            Streamlined, secure, and built for the modern lawyer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              className="text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4 hover:bg-primary/5"
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Image Carousel Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              See Our Platform in Action
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore the intuitive interface designed specifically for legal
              professionals.
            </p>
          </div>

          <div className="relative max-w-9xl mx-auto">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
              <div className="relative h-96 flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                <div className="text-center w-full h-full">
                  <img
                    src={carouselImages[currentSlide].image}
                    alt={carouselImages[currentSlide].alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {carouselImages[currentSlide].title}
                    </h3>
                    <p className="text-lg text-white">
                      {carouselImages[currentSlide].description}
                    </p>
                  </div>
                </div>
              </div>
              {/* Slide indicators */}
              <div className="flex justify-center py-4 space-x-2">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? "bg-primary" : "bg-gray-300"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Why Choose Lawyer's Case Diary?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Join thousands of legal professionals who have transformed their
              practice with our comprehensive platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader className="p-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <div className="text-xl font-bold text-primary">
                    {benefit.stat}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <CardDescription className="text-sm">
                    {benefit.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Everything You Need in One Platform
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              From case management to billing and client communication, we've
              got all the tools you need to run your practice efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Clients Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Lawyer's Case Diary has helped legal professionals
              streamline their practice and increase productivity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-foreground">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Get full access to all features with a simple one-time payment. No monthly bills, forever.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="relative border-primary shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-medium">
                  Complete Solution
                </span>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-outfit font-bold">Professional Access</CardTitle>
                <div className="flex items-baseline justify-center mt-4">
                  <span className="text-4xl font-black text-foreground font-outfit tracking-tighter">
                    Rs 40k
                  </span>
                  <span className="text-muted-foreground ml-2 text-base">one-time</span>
                </div>
                <CardDescription className="text-sm mt-3 max-w-[80%] mx-auto">
                  Invest once in your practice. Own the most advanced legal toolset forever.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button className="w-full text-lg py-3" asChild>
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <HeartHandshake className="w-16 h-16 text-primary-foreground mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Join thousands of legal professionals who trust Lawyer's Case Diary
            to manage their practice efficiently and profitably.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-4"
            asChild
          >
            <Link to="/signup">Get Started Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-muted border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Scale className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">
                  Lawyer's Case Diary
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                The complete practice management solution for legal
                professionals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Training
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t">
            <p className="text-muted-foreground text-sm">
              © 2024 Lawyer's Case Diary. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
