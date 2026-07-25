import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CakeSlice,
  Coffee,
  CupSoda,
  Facebook,
  Heart,
  HeartHandshake,
  Instagram,
  MessageCircle,
  Music,
  Sandwich,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Utensils
} from "lucide-react";
import birthdayTreatsImage from "../assets/Images/Birthday-Treats.png";
import coldDrinksShakesImage from "../assets/Images/Cold-Drinks&Shakes.jpg";
import collegeHangoutsImage from "../assets/Images/College-Hangouts.webp";
import coupleDatesImage from "../assets/Images/Couple-Dates.jpg";
import dessertsImage from "../assets/Images/Desserts.jpg";
import dineInExperienceImage from "../assets/Images/Dine-In-Experience.png";
import eveningSnacksImage from "../assets/Images/Evening-Snacks.webp";
import familyTimeImage from "../assets/Images/Family-Time.jpg";
import freshSnacksImage from "../assets/Images/Fresh-Snacks.jpg";
import friendsMeetupImage from "../assets/Images/Friends-Meetup.webp";
import matchScreeningsImage from "../assets/Images/Match-Screenings.png";
import quickBitesImage from "../assets/Images/Quick-Bites.webp";
import signatureChaiCoffeeImage from "../assets/Images/Signature-Chai&Coffee.jpg";
import workChillImage from "../assets/Images/Work&Chill.png";
import cafeHeroVideo from "../assets/videos/cafe-hero-video.mp4";
import cafeStoryVideo from "../assets/videos/cafe-story.mp4";
import liveMusicVideo from "../assets/videos/live-music.mp4";
import liveProjectorVideo from "../assets/videos/live-projector.mp4";
import review1Video from "../assets/videos/review-1.mp4";
import review2Video from "../assets/videos/review-2.mp4";
import review3Video from "../assets/videos/review-3.mp4";
import review4Video from "../assets/videos/review-4.mp4";
import review5Video from "../assets/videos/review-5.mp4";

const instagramUrl = "https://www.instagram.com/theinfusionsaga?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";
const instagramFooterUrl = instagramUrl;
const facebookUrl = "https://facebook.com/theinfusionsaga";
const twitterUrl = "https://x.com/theinfusionsaga";
const feedbackUrl = "https://www.google.com/maps/place/THE+INFUSION+SAGA/@26.8225601,75.8622093,17z/data=!4m8!3m7!1s0x396dc966259bc005:0x6f80b79a5e8920d9!8m2!3d26.8225601!4d75.8622093!9m1!1b1!16s%2Fg%2F11z235wkw8?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D";
const supportEmail = "theinfusionsaga@gmail.com";
const fssaiImagePath = "/images/fssai.png";

const serveItems = [
  {
    title: "Dine-in Experience",
    description: "Comfortable seating, cozy vibes, and space to actually enjoy your time.",
    icon: HeartHandshake,
    image: dineInExperienceImage
  },
  {
    title: "Quick Bites",
    description: "Easy, satisfying plates for short breaks and spontaneous plans.",
    icon: Utensils,
    image: quickBitesImage
  },
  {
    title: "Cold Drinks & Shakes",
    description: "Refreshing drinks, chilled shakes, mojitos, and mood-lifting sips.",
    icon: CupSoda,
    image: coldDrinksShakesImage
  },
  {
    title: "Fresh Snacks",
    description: "Cafe style snacks and quick bites prepared for everyday cravings.",
    icon: Sandwich,
    image: freshSnacksImage
  },
  {
    title: "Desserts",
    description: "Sweet treats, indulgent moments, and a little celebration in every bite.",
    icon: CakeSlice,
    image: dessertsImage
  },
  {
    title: "Signature Chai & Coffee",
    description: "Handcrafted beverages made fresh daily with a comforting cafe finish.",
    icon: Coffee,
    image: signatureChaiCoffeeImage
  }
];

const bestForItems = [
  { title: "Couple Dates", description: "A cozy setting for relaxed conversations and shared treats.", icon: Heart, image: coupleDatesImage },
  { title: "Friends Meetup", description: "Comfortable space for catching up over snacks and drinks.", icon: HeartHandshake, image: friendsMeetupImage },
  { title: "College Hangouts", description: "Student-friendly cafe energy for everyday plans after class.", icon: Sparkles, image: collegeHangoutsImage },
  { title: "Birthday Treats", description: "Sweet moments, desserts, and celebration-ready cafe vibes.", icon: CakeSlice, image: birthdayTreatsImage },
  { title: "Work & Chill", description: "A calm corner for light work, coffee, and easy breaks.", icon: Timer, image: workChillImage },
  { title: "Evening Snacks", description: "Fresh bites and beverages for your evening cravings.", icon: Sandwich, image: eveningSnacksImage },
  { title: "Family Time", description: "Warm service and comfortable seating for simple family outings.", icon: ShieldCheck, image: familyTimeImage },
  { title: "Match Screenings", description: "Shared screen moments with food, friends, and cafe energy.", icon: Trophy, image: matchScreeningsImage }
];

const visualMoments = [
  {
    title: "Live Projector Nights",
    description:
      "Sports screenings, movie nights, match screenings, and a group viewing experience that turns ordinary evenings into shared cafe moments.",
    icon: Trophy
  },
  {
    title: "Live Music Evenings",
    description:
      "Acoustic evenings, weekend performances, warm cafe atmosphere, and a relaxing vibe designed for slow conversations and good company.",
    icon: Music
  }
];

const customerExperiences = [
  {
    name: "Ravikant Sharma",
    review: "Great Coffee, a welcoming atmosphere, and conversations that feel effortless.☕✨"
  },
  {
    name: "Harsh Desai",
    review: "I love the ambiance, a place that feels familiar.💛"
  },
  {
    name: "Vedica",
    review: "A newly opened cafe serving good vibes and good food.🥰"
  },
  {
    name: "Vedica",
    review: "I keep coming back here, and honestly, it's the staff that makes this place special — always so polite and friendly! 💖"
  },
  {
    name: "Arpana",
    review: "I love the cold coffee and the vibe of this place.😊❤️"
  }
];

const defaultAboutVideoSources = [
  cafeHeroVideo,
  cafeStoryVideo,
  liveProjectorVideo,
  liveMusicVideo,
  review1Video,
  review2Video,
  review3Video,
  review4Video,
  review5Video
];

const highStreetAboutVideoSources = [
  liveProjectorVideo,
  liveMusicVideo,
  cafeStoryVideo,
  review3Video,
  review4Video,
  review5Video,
  review1Video
];

// Outlet-specific content overrides. Keep default values (Near SKIT) in the existing constants above.
const OUTLET_CONTENT = {
  "near-high-street": {
    navTitle: "Near High Street - Capital Mall",
    heroTitle: "Near High Street Capital Mall",
    heroDescription: "A breezy cafe experience with rooftop views, outdoor garden seating and family-friendly vibes.",
    serveItems: [
      { title: "Rooftop View", description: "Open-air seating with skyline views and evening ambience.", icon: Trophy, image: coupleDatesImage },
      { title: "Indoor AC Sitting", description: "Comfortable air-conditioned indoor seating for relaxed dining.", icon: ShieldCheck, image: dineInExperienceImage },
      { title: "Outdoor Garden Sitting", description: "Fresh greenery and outdoor tables for breezy evenings.", icon: Sparkles, image: friendsMeetupImage },
      { title: "Fresh Greenery", description: "Lush plants and a green atmosphere to unwind.", icon: HeartHandshake, image: familyTimeImage },
      { title: "Evening Ambience", description: "Soft lighting and music for pleasant evenings.", icon: Music, image: eveningSnacksImage },
      { title: "Family Friendly Seating", description: "Spacious tables and a warm setting for families.", icon: Heart, image: freshSnacksImage }
    ],
    bestForItems: [
      { title: "Couple Dates", description: "A serene rooftop for conversations and shared moments.", icon: Heart, image: coupleDatesImage },
      { title: "Friends Meetup", description: "Open tables for casual meetups and group evenings.", icon: HeartHandshake, image: friendsMeetupImage },
      { title: "Family Time", description: "Comfortable seating and a warm atmosphere for family dinners.", icon: ShieldCheck, image: familyTimeImage },
      { title: "Evening Snacks", description: "Perfect for late snacks and evening hangouts.", icon: Sandwich, image: eveningSnacksImage }
    ],
    visualMoments: visualMoments,
    customerExperiences: [
      { name: "Anjali Patel", review: "Lovely rooftop, great ambience and friendly staff!" },
      { name: "Saurabh", review: "Perfect for evening meetups — the garden seating is delightful." },
      { name: "Neha", review: "Food was great and the AC seating is very comfortable." }
    ],
    aboutVideoSources: highStreetAboutVideoSources
  }
};

const footerColumns = [
  {
    title: "INFO",
    links: ["About The Infusion Saga", "Our Menu", "Cafe Experience", "FSSAI"]
  },
  {
    title: "CONTACT",
    links: ["Visit Cafe", "Customer Support", "Instagram", "Feedback"]
  },
  {
    title: "LEGAL",
    links: ["Terms & Conditions", "Privacy Policy", "Refund Policy"]
  }
];

const legalContent = {
  terms: {
    title: "Terms & Conditions",
    body: "Orders are prepared as per cafe availability and selected options. Prices, menu items, and offers may change without prior notice. Customers are requested to review their order before payment or confirmation. The Infusion Saga may refuse or cancel orders in case of incorrect details, unavailable items, or misuse of services."
  },
  privacy: {
    title: "Privacy Policy",
    body: "We collect only the basic details needed to process orders, support requests, and cafe communication, such as name, phone number, order details, and payment status. We do not sell customer information. For privacy queries, contact theinfusionsaga@gmail.com."
  },
  refund: {
    title: "Refund Policy",
    body: "Refunds, if applicable, will be reviewed for failed payments, duplicate payments, or order issues. For support, contact theinfusionsaga@gmail.com."
  }
};

function SectionShell({ eyebrow, title, children, className = "", id }) {
  return (
    <section id={id} className={`about-section about-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8 ${className}`}>
      {(eyebrow || title) && (
        <div className="mb-6 max-w-3xl">
          {eyebrow && <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-900/70">{eyebrow}</p>}
          {title && <h2 className="mt-2 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}

function PremiumButton({ children, onClick, href, className = "" }) {
  const classes = `about-premium-button group inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#050505,#2b211d)] px-6 py-3.5 text-sm font-black text-white shadow-[0_18px_38px_rgba(0,0,0,0.24),0_0_28px_rgba(255,190,150,0.2)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(0,0,0,0.3),0_0_38px_rgba(255,190,150,0.34)] ${className}`;
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
      <ArrowRight size={17} className="transition group-hover:translate-x-0.5" />
    </button>
  );
}

function InfoModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-[1.5rem] border border-white/65 bg-[#fffaf2] p-6 text-stone-950 shadow-[0_28px_90px_rgba(0,0,0,0.32)]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-black px-3 py-1.5 text-xs font-black text-white transition hover:bg-stone-800"
          >
            Close
          </button>
        </div>
        <div className="mt-4 text-sm font-semibold leading-7 text-stone-700">{children}</div>
      </div>
    </div>
  );
}

function VideoPlaceholder({ label, className = "", videoSrc }) {
  return (
    <div className={`about-video-card group relative isolate min-h-64 overflow-hidden rounded-[2rem] border border-white/65 bg-[linear-gradient(145deg,rgba(255,255,255,0.58),rgba(255,224,199,0.28),rgba(255,255,255,0.28))] shadow-[0_24px_72px_rgba(67,45,28,0.18)] backdrop-blur-2xl ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.95),transparent_30%),radial-gradient(circle_at_82%_76%,rgba(251,146,60,0.24),transparent_34%),linear-gradient(135deg,rgba(17,17,17,0.03),rgba(17,17,17,0.13))] transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-5 rounded-[1.5rem] border border-white/50 bg-white/16" />
      <div className="relative z-10 h-full min-h-inherit">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="h-full w-full rounded-[1.5rem] object-cover"
            controls
            muted
            playsInline
            preload="metadata"
            loop
            aria-label={label}
          />
        ) : (
          <div className="flex h-full min-h-inherit flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="rounded-full bg-white/70 px-5 py-2 text-sm font-black text-stone-900 backdrop-blur-xl">{label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Carousel({ children }) {
  return (
    <div className="about-carousel -mx-4 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="about-carousel-track flex w-max gap-4">{children}</div>
    </div>
  );
}

function ServiceCard({ item }) {
  const Icon = item.icon;
  return (
    <article className="about-service-card about-lift group w-[17.5rem] shrink-0 rounded-[1.75rem] border border-white/65 bg-white/50 p-5 shadow-[0_20px_54px_rgba(67,45,28,0.14)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/68 hover:shadow-[0_28px_64px_rgba(67,45,28,0.2)] sm:w-[20rem]">
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          className="h-20 w-20 rounded-3xl object-cover shadow-[0_16px_34px_rgba(67,45,28,0.18)] transition duration-300 group-hover:scale-105"
        />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-black text-white shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition duration-300 group-hover:scale-105">
          <Icon size={30} />
        </span>
      )}
      <h3 className="mt-6 text-xl font-black leading-tight text-stone-950">{item.title}</h3>
      <p className="mt-3 text-sm font-bold leading-6 text-stone-700">{item.description}</p>
    </article>
  );
}

function StarRating() {
  return (
    <div className="flex gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} size={16} fill="currentColor" />
      ))}
    </div>
  );
}

function XSocialIcon() {
  return <span className="text-base font-black leading-none">X</span>;
}

function getOutletSlugFromPath() {
  try {
    if (typeof window === "undefined") return "";
    const segments = window.location.pathname.split("/").filter(Boolean);
    // Customer menu: /menu/:outletSlug/...
    if (segments[0] === "menu" && segments[1]) return String(segments[1] || "");
    // Fallback: if the app stored a selected outlet in sessionStorage (CustomerApp sync), use it
    try {
      const stored = sessionStorage.getItem("infusion-selected-outlet");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.slug) return String(parsed.slug || "");
      }
    } catch (e) {
      // ignore
    }
    return "";
  } catch (e) {
    return "";
  }
}

export default function AboutCafe({ navigate }) {
  const [modal, setModal] = React.useState(null);
  const [fssaiMissing, setFssaiMissing] = React.useState(false);
  const outletSlug = getOutletSlugFromPath();
  const outletOverride = OUTLET_CONTENT[String(outletSlug || "").toLowerCase()] || null;
  const content = {
    navTitle: outletOverride?.navTitle || "THE INFUSION SAGA",
    heroTitle: outletOverride?.heroTitle || "Welcome to The Infusion Saga",
    heroDescription: outletOverride?.heroDescription || "A cozy cafe experience crafted for conversations, comfort, unforgettable flavors, and the kind of everyday moments that deserve a beautiful place.",
    serveItems: outletOverride?.serveItems || serveItems,
    bestForItems: outletOverride?.bestForItems || bestForItems,
    visualMoments: outletOverride?.visualMoments || visualMoments,
    customerExperiences: outletOverride?.customerExperiences || customerExperiences,
    aboutVideoSources: outletOverride?.aboutVideoSources || defaultAboutVideoSources
  };

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleFooterLink(link) {
    if (link === "About The Infusion Saga") scrollToSection("our-story");
    if (link === "Our Menu") navigate("/");
    if (link === "Cafe Experience") scrollToSection("visual-moments");
    if (link === "FSSAI") setModal("fssai");
    if (link === "Visit Cafe") scrollToSection("hero");
    if (link === "Customer Support") scrollToSection("customer-support");
    if (link === "Instagram") openExternal(instagramFooterUrl);
    if (link === "Feedback") openExternal(feedbackUrl);
    if (link === "Terms & Conditions") setModal("terms");
    if (link === "Privacy Policy") setModal("privacy");
    if (link === "Refund Policy") setModal("refund");
  }

  return (
    <main className="about-cafe-page min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_36%,#fff4df_70%,#d8dec8_100%)] text-stone-950">
      <style>{`
        .about-reveal {
          animation: aboutFadeUp 0.8s ease both;
          animation-timeline: view();
          animation-range: entry 0% cover 30%;
        }
        .about-reveal:first-of-type {
          animation-timeline: auto;
        }
        @keyframes aboutFadeUp {
          from { opacity: 0; transform: translateY(26px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-none {
          scrollbar-width: none;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .min-h-inherit {
          min-height: inherit;
        }
        @media (prefers-reduced-motion: reduce) {
          .about-reveal, .about-lift, .about-cafe-page * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="pointer-events-none fixed -left-20 top-24 h-72 w-72 rounded-full bg-white/35 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-10 h-80 w-80 rounded-full bg-rose-200/45 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-100/55 blur-3xl" />

      <header className="about-navbar-wrap sticky top-0 z-30 px-4 py-3 sm:px-6 lg:px-8">
        <nav className="about-navbar mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center rounded-full border border-white/65 bg-white/42 px-3 py-2 shadow-[0_16px_42px_rgba(67,45,28,0.14)] backdrop-blur-2xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-full bg-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-800"
          >
            <ArrowLeft size={19} />
          </button>
          <p className="text-center text-sm font-black uppercase tracking-[0.2em] text-stone-950 sm:text-base">{content.navTitle}</p>
          <span className="h-11 w-11" aria-hidden="true" />
        </nav>
      </header>

      <SectionShell id="hero" className="about-hero pt-6 lg:pt-10">
        <div className="about-hero-grid grid min-h-[calc(100vh-7rem)] items-center gap-7 lg:grid-cols-2">
          <div className="about-hero-copy max-w-3xl">
            <h1 className="text-5xl font-black leading-[0.95] text-stone-950 sm:text-6xl lg:text-7xl">
              {content.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base font-bold leading-8 text-stone-700 sm:text-lg">
              {content.heroDescription}
            </p>
            <div className="about-hero-actions mt-8 flex flex-col gap-3 sm:flex-row">
              <PremiumButton onClick={() => navigate("/")}>Explore Menu</PremiumButton>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="about-secondary-button inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/50 px-6 py-3.5 text-sm font-black text-stone-950 shadow-[0_16px_34px_rgba(67,45,28,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/72"
              >
                <Instagram size={18} />
                Follow Instagram
              </a>
            </div>
          </div>
          <VideoPlaceholder label="Cafe Hero Video" className="min-h-[22rem] lg:min-h-[34rem]" videoSrc={content.aboutVideoSources[0]} />
        </div>
      </SectionShell>

      <SectionShell id="our-story" eyebrow="Our story" title="Cafe culture, crafted warmly">
        <div className="about-story-card grid gap-6 rounded-[2.25rem] border border-white/65 bg-white/42 p-4 shadow-[0_28px_80px_rgba(67,45,28,0.16)] backdrop-blur-2xl sm:p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-7">
          <VideoPlaceholder label="Cafe Story Video" className="min-h-[20rem] lg:min-h-full" videoSrc={content.aboutVideoSources[1]} />
          <div className="about-story-copy flex flex-col justify-center rounded-[1.75rem] bg-white/28 p-4 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-900/70">THE INFUSION SAGA</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl">More than a menu, it is a modern cafe pause.</h2>
            <div className="mt-5 space-y-4 text-sm font-semibold leading-7 text-stone-700 sm:text-base sm:leading-8">
              <p>
                {content.heroDescription}
                From signature chai and handcrafted coffees to refreshing mojitos, shakes, snacks, and desserts, every
                item is made to give customers a fresh cafe experience.
              </p>
              <p>
                The cafe was created for people who wanted more than a quick order. It is a place for conversations after class,
                calm work breaks, casual dates, family treats, and evenings where food, drinks, music, and ambience come together naturally.
              </p>
              <p>
                <span className="rounded-full bg-black px-3 py-1 text-sm font-black text-white">Our vision:</span> Serve fresh ingredients, memorable signature drinks, and cafe-style snacks inside a space that feels
                comfortable, student friendly, and welcoming without losing its premium mood. Every detail is meant to make customers feel
                relaxed the moment they enter. In the future, we are planning to scale The Infusion Saga into more outlets while keeping
                the same quality, comfort, and cafe experience.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell eyebrow="Freshly crafted" title="What We Serve">
        <Carousel>
          {content.serveItems.map((item) => (
            <ServiceCard key={item.title} item={item} />
          ))}
        </Carousel>
      </SectionShell>

      <SectionShell id="visual-moments" eyebrow="Visual moments" title="Experiences beyond the table">
        <div className="grid gap-5 lg:grid-cols-2">
          {content.visualMoments.map((moment, index) => {
            const Icon = moment.icon;
            return (
              <article key={moment.title} className="about-cinematic-card about-lift overflow-hidden rounded-[2rem] border border-white/65 bg-white/46 shadow-[0_24px_72px_rgba(67,45,28,0.16)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_82px_rgba(67,45,28,0.22)]">
                <VideoPlaceholder label={`${moment.title} Video`} className="min-h-[20rem] rounded-none border-0 shadow-none" videoSrc={content.aboutVideoSources[2 + index]} />
                <div className="p-6">
                  <span className="grid h-13 w-13 place-items-center rounded-2xl bg-black p-3 text-white">
                    <Icon size={25} />
                  </span>
                  <h3 className="mt-5 text-2xl font-black text-stone-950">{moment.title}</h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-stone-700">{moment.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell eyebrow="Every visit matters" title="Best For">
        <Carousel>
          {content.bestForItems.map((item) => (
            <ServiceCard key={item.title} item={item} />
          ))}
        </Carousel>
      </SectionShell>

      <SectionShell title="Customer Experiences">
        <Carousel>
          {content.customerExperiences.map((experience, index) => (
            <article key={`${experience.name}-${index}`} className="about-review-card about-lift w-[18rem] shrink-0 overflow-hidden rounded-[1.75rem] border border-white/65 bg-white/50 shadow-[0_22px_60px_rgba(67,45,28,0.15)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 sm:w-[21rem]">
              <VideoPlaceholder label="Customer Video" className="min-h-[15rem] rounded-none border-0 shadow-none" videoSrc={content.aboutVideoSources[4 + index] || content.aboutVideoSources[index % content.aboutVideoSources.length]} />
              <div className="p-5">
                <p className="text-lg font-black text-stone-950">{experience.name}</p>
                <div className="mt-2"><StarRating /></div>
                <p className="mt-3 text-sm font-bold leading-6 text-stone-700">{experience.review}</p>
              </div>
            </article>
          ))}
        </Carousel>
      </SectionShell>

      <SectionShell id="customer-support" title="Customer Support">
        <div className="about-support-card overflow-hidden rounded-[2.25rem] border border-white/65 bg-white/48 p-5 shadow-[0_28px_80px_rgba(67,45,28,0.16)] backdrop-blur-2xl sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-black text-white shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
                <MessageCircle size={32} />
              </span>
              <h3 className="mt-5 text-3xl font-black text-stone-950">Customer Support</h3>
              <p className="mt-3 text-sm font-bold leading-7 text-stone-700">
                Have a query, feedback, or need help with your order? Mail us your query and our team will get back to you.
              </p>
              <a href={`mailto:${supportEmail}`} className="mt-5 inline-flex rounded-full bg-white/70 px-4 py-2 text-sm font-black text-stone-900 shadow-sm backdrop-blur-xl transition hover:bg-white">
                {supportEmail}
              </a>
              <PremiumButton href={`mailto:${supportEmail}`} className="mt-5">Mail Us Your Query</PremiumButton>
            </div>
            <div className="rounded-[1.75rem] border border-white/60 bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(255,224,199,0.34))] p-6 shadow-[0_18px_44px_rgba(67,45,28,0.12)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-900/70">Support Hours</p>
              <p className="mt-3 text-2xl font-black text-stone-950">Mail us anytime</p>
              <p className="mt-3 text-sm font-bold leading-7 text-stone-700">
                Share your order concern, cafe feedback, or general query. We will respond as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="about-cta-banner relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,213,190,0.42),rgba(255,244,223,0.6))] p-7 shadow-[0_30px_90px_rgba(67,45,28,0.18)] backdrop-blur-2xl sm:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/45 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-4xl font-black leading-[0.98] text-stone-950 sm:text-5xl">
                Fresh Taste.
                <br />
                Cozy Moments.
              </h2>
              <p className="mt-4 max-w-2xl text-base font-bold leading-7 text-stone-700">
                Built for conversations, comfort and unforgettable flavors.
              </p>
            </div>
            <PremiumButton onClick={() => navigate("/")} className="w-full bg-[linear-gradient(135deg,#030303,#171717)] shadow-[0_18px_42px_rgba(0,0,0,0.28)] sm:w-auto">Order Now</PremiumButton>
          </div>
        </div>
      </SectionShell>

      <footer className="relative z-10 mt-8 bg-[#111111] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 border-b border-white/15 pb-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-black tracking-[0.16em] text-rose-200">{column.title}</h3>
                <div className="mt-4 grid gap-2">
                  {column.links.map((link) => (
                    <button
                      key={link}
                      type="button"
                      onClick={() => handleFooterLink(link)}
                      className="w-fit text-left text-sm font-bold text-white/75 transition hover:text-white"
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <h3 className="text-sm font-black tracking-[0.16em] text-rose-200">SOCIALS</h3>
              <div className="mt-4 flex gap-3">
                {[
                  { label: "Instagram", href: instagramUrl, icon: Instagram },
                  { label: "Facebook", href: facebookUrl, icon: Facebook },
                  { label: "Twitter/X", href: twitterUrl, icon: XSocialIcon }
                ].map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white hover:text-black"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <p className="pt-6 text-sm font-bold text-white/68">© 2026 The Infusion Saga. All Rights Reserved.</p>
        </div>
      </footer>

      {modal === "fssai" && (
        <InfoModal title="FSSAI" onClose={() => { setModal(null); setFssaiMissing(false); }}>
          {!fssaiMissing ? (
            <img
              src={fssaiImagePath}
              alt="FSSAI certificate"
              className="max-h-[70vh] w-full rounded-2xl object-contain"
              onError={() => setFssaiMissing(true)}
            />
          ) : (
            <p>FSSAI certificate will appear here.</p>
          )}
        </InfoModal>
      )}
      {modal && legalContent[modal] && (
        <InfoModal title={legalContent[modal].title} onClose={() => setModal(null)}>
          <p>{legalContent[modal].body}</p>
        </InfoModal>
      )}
    </main>
  );
}
