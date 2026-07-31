import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileText,
  CreditCard,
  Building2,
  Car,
  Home,
  HeartPulse,
  Receipt,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Bot,
  Users,
  Award,
  Clock,
  PhoneCall,
  Search,
} from "lucide-react";
import { landmarkImages } from "../data/mockData";

interface HeroLandingProps {
  onOpenAuth: (view: "login" | "signup") => void;
  onExploreServices: () => void;
  onOpenAiAssistant: () => void;
  langUrdu: boolean;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onOpenAuth,
  onExploreServices,
  onOpenAiAssistant,
  langUrdu,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: langUrdu ? "فیصل مسجد، اسلام آباد - قومی خدمات کا ستون" : "Faisal Mosque, Islamabad",
      subtitle: langUrdu ? "شفاف، بااعتماد اور جدید ڈیجیٹل حکومت" : "Empowering 240M+ Citizens with Sovereign Digital Infrastructure",
      image: landmarkImages.faisalMosque,
    },
    {
      title: langUrdu ? "بادشاہی مسجد، لاہور - ہماری تاریخ، ہمارا فخر" : "Badshahi Mosque & Heritage, Lahore",
      subtitle: langUrdu ? "پاسپورٹ، شناختی کارڈ اور ٹیکس سروسز ایک ہی جگہ" : "Seamless Cross-Agency Digital Public Services Gateway",
      image: landmarkImages.badshahiMosque,
    },
    {
      title: langUrdu ? "ہنزہ وادی، قراقرم - پاکستان کی خوبصورتی" : "Hunza Valley & Karakoram Highway",
      subtitle: langUrdu ? "پورے پاکستان میں تیز رفتار اور محفوظ عوامی خدمات" : "Serving Every Citizen Across All Provinces & Overseas Consulates",
      image: landmarkImages.hunzaValley,
    },
    {
      title: langUrdu ? "منارِ پاکستان، لاہور - قومی یکجہتی" : "Minar-e-Pakistan, Lahore",
      subtitle: langUrdu ? "ڈیجیٹل پاکستان ویژن 2026" : "Next-Generation Paperless National Citizen Architecture",
      image: landmarkImages.minarEPakistan,
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden bg-slate-900 text-white selection:bg-[#01411C] selection:text-white">
      {/* Hero Full-Screen Slideshow */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=1600";
              }}
              className="w-full h-full object-cover filter brightness-[0.38] contrast-105"
            />
            {/* Emerald gradient vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-[#01411C]/40 to-transparent" />
          </div>
        ))}

        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#01411C]/90 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-xs font-bold tracking-wide uppercase shadow-lg mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {langUrdu ? "حکومت پاکستان - سمارٹ گورننس پورٹل" : "Official Government Digital Portal • State Security Enforced"}
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
            {langUrdu ? (
              <span>پاکستان قومی شہری خدمات پورٹل</span>
            ) : (
              <span>
                One Portal for Every <span className="text-emerald-300 underline decoration-emerald-500/50">Pakistani Citizen</span>
              </span>
            )}
          </h1>

          <p className="mt-6 text-lg sm:text-2xl text-slate-200 max-w-3xl mx-auto font-light leading-relaxed">
            {heroSlides[currentSlide].subtitle}
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth("signup")}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#01411C] hover:bg-emerald-900 text-white font-bold text-base transition shadow-xl shadow-[#01411C]/40 flex items-center justify-center space-x-2 border border-emerald-400/30 group"
            >
              <span>{langUrdu ? "نیا اکاونٹ بنائیں" : "Create Citizen Account"}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>

            <button
              onClick={onExploreServices}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base backdrop-blur-md border border-white/20 transition flex items-center justify-center space-x-2"
            >
              <FileText className="w-5 h-5 text-emerald-300" />
              <span>{langUrdu ? "خدمات دیکھیں" : "Explore Citizen Services"}</span>
            </button>

            <button
              onClick={onOpenAiAssistant}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-base backdrop-blur-md border border-slate-700 transition flex items-center justify-center space-x-2"
            >
              <Bot className="w-5 h-5 text-emerald-400" />
              <span>Ask AI Guide</span>
            </button>
          </div>

          {/* Slide Indicator Dots */}
          <div className="mt-12 flex items-center justify-center space-x-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "w-8 bg-emerald-400" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                title={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quick Verification Stats Bar */}
      <section className="bg-emerald-900/90 border-y border-emerald-700/50 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-xs font-medium text-emerald-200">
          <div className="flex flex-wrap items-center justify-center gap-6 text-emerald-300 font-semibold">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>NADRA Verified</span>
            </span>
            <span className="flex items-center space-x-1">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>256-Bit SSL Encrypted</span>
            </span>
            <span className="flex items-center space-x-1">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Overseas Consulates Connected</span>
            </span>
          </div>
        </div>
      </section>

      {/* Core Services Grid */}
      <section className="py-20 bg-zinc-900/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {langUrdu ? "اہم قومی خدمات" : "Integrated National Public Services"}
            </h2>
            <p className="mt-3 text-base text-zinc-400 font-normal">
              Access official services for passports, tax returns, identity credentials, property records, and credit metrics from a single secure account.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Passport Services & Renewal",
                desc: "Machine Readable Passport renewal, urgent processing, regional office appointment, and live QR receipt tracking.",
                icon: FileText,
                badge: "Directorate General Passports",
              },
              {
                title: "Income Tax & FBR Filings",
                desc: "Active Taxpayer Status (ATL), tax return submission, instant tax slab calculator, and tax exemption statements.",
                icon: Receipt,
                badge: "FBR Iris Portal",
              },
              {
                title: "National Identity (CNIC / FRC)",
                desc: "Smart CNIC verification, NICOP renewal, Family Registration Certificates, and address modification.",
                icon: ShieldCheck,
                badge: "NADRA Authority",
              },
              {
                title: "Credit Score & Loan Summary",
                desc: "Interactive citizen credit score gauge, debt-to-income summary, and bank credit health analysis.",
                icon: CreditCard,
                badge: "State Bank Credit",
              },
              {
                title: "Driving License & Vehicle Tax",
                desc: "Digital driving license QR preview, driving test appointment, vehicle registration & token tax e-payment.",
                icon: Car,
                badge: "E-Routing & Traffic Police",
              },
              {
                title: "E-Zameen Property Cadastre",
                desc: "Registered plot records, Digital Fard (title deed) downloads, stamp duty calculator, and land transfer.",
                icon: Home,
                badge: "Revenue Board Cadastre",
              },
              {
                title: "Healthcare & Sehat Card",
                desc: "Sehat Sahulat Card balance check, empanelled hospital locator map, and medical insurance claim history.",
                icon: HeartPulse,
                badge: "National Health Program",
              },
              {
                title: "Utility Bills & E-Khidmat",
                desc: "Consolidated electricity (IESCO/LESCO), gas (SNGPL), and water bill e-payments with instant receipt.",
                icon: Building2,
                badge: "E-Khidmat Gateway",
              },
            ].map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  onClick={onExploreServices}
                  className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-800/30 hover:border-emerald-500/50 hover:bg-emerald-900/30 transition duration-300 cursor-pointer group flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-900/80 border border-emerald-700/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition duration-300 shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="mt-4 inline-block text-[10px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-700/50">
                      {service.badge}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-white group-hover:text-emerald-300 transition">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{service.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-emerald-900/40 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                    <span>Access Service</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified National Metrics Section */}
      <section className="py-16 bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-950 border-t border-emerald-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Users className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-3xl sm:text-4xl font-extrabold text-white">15.4M+</div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">Verified Registered Citizens</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-3xl sm:text-4xl font-extrabold text-white">99.8%</div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">SLA Passport & Tax Resolution</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Clock className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-3xl sm:text-4xl font-extrabold text-white">2 Minutes</div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">Average Instant E-Payment Time</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <PhoneCall className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-3xl sm:text-4xl font-extrabold text-white">111-92-92</div>
              <p className="text-xs text-emerald-200 mt-1 font-medium">24/7 Citizen Helpline Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-10 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto space-y-3">
          <p className="font-semibold text-zinc-400">
            Government of Pakistan • Digital Citizen Services & Sovereign Portal Architecture
          </p>
          <p>
            Designed for high performance, accessibility, and sovereign data privacy. All verification systems connected via encrypted government gateway APIs.
          </p>
          <div className="flex items-center justify-center space-x-4 pt-2 text-emerald-400 font-mono text-[11px]">
            <span>Version 2026.4.1</span>
            <span>•</span>
            <span>NADRA Sync</span>
            <span>•</span>
            <span>FBR Iris Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
