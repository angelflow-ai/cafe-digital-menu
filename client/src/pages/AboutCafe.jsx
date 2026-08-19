import React from "react";
import {
  ArrowRight,
  CakeSlice,
  Clock3,
  Coffee,
  CupSoda,
  Facebook,
  Heart,
  HeartHandshake,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Sandwich,
  ShieldCheck,
  Sparkles,
  Star,
  Timer,
  Trees,
  Trophy,
  Utensils,
  Wifi
} from "lucide-react";
import { api } from "../services/apiClient";
import { createEmptyWebsiteContent, normalizeWebsiteContentPayload } from "../services/websiteContentService";
import cafeHeroVideo from "../assets/videos/cafe-hero-video.mp4";
import homePageVideo from "../assets/videos/home-page-video.mp4";
import cafeStoryVideo from "../assets/videos/cafe-story.mp4";
import liveMusicVideo from "../assets/videos/live-music.mp4";
import liveProjectorVideo from "../assets/videos/live-projector.mp4";
import reviewVideoOne from "../assets/videos/review-1.mp4";
import reviewVideoTwo from "../assets/videos/review-2.mp4";
import reviewVideoThree from "../assets/videos/review-3.mp4";
import reviewVideoFour from "../assets/videos/review-4.mp4";
import rooftopVideo from "../assets/videos/rooftop.mp4";
import logoUrl from "../assets/infusion-saga-logo.png";
import swiggyIcon from "../assets/icons/swiggy.webp";
import zomatoIcon from "../assets/icons/zomato.webp";
import outletOneImage from "../assets/Images/Signature-Chai&Coffee.jpg";
import outletTwoImage from "../assets/Images/Desserts.jpg";
import galleryOneImage from "../assets/Images/Fresh-Snacks.jpg";
import galleryTwoImage from "../assets/Images/Family-Time.jpg";
import signatureBestSellerImage from "../assets/Images/Signature-Chai&Coffee.jpg";
import nearSkitOutletImage from "../assets/Images/near-skit.webp";
import nearHighStreetOutletImage from "../assets/Images/near-high-street-capital-mall.webp";
import freshSnacksBestSellerImage from "../assets/Images/fresh-snacks-&comfort-bites.webp";
import dessertsBestSellerImage from "../assets/Images/desserts&sweet-escapes.webp";
import galleryThreeImage from "../assets/Images/Work&Chill.png";
import galleryFourImage from "../assets/Images/Couple-Dates.jpg";
import cozyDineInImage from "../assets/Images/cozy-dine-in.png";
import weekendGlowImage from "../assets/Images/weekend-glow.png";
import warmGatheringsImage from "../assets/Images/warm-gatherings.png";
import quietWorktimeImage from "../assets/Images/quiet-worktime.png";
import nearSkitMapImage from "../assets/near-skit-map.png";
import nearHighStreetMapImage from "../assets/near-high-street-map.png";

const instagramUrl = "https://www.instagram.com/theinfusionsaga?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";
const instagramFooterUrl = instagramUrl;
const facebookUrl = "https://facebook.com/theinfusionsaga";
const twitterUrl = "https://x.com/theinfusionsaga";
const feedbackUrl = "https://www.google.com/maps/place/THE+INFUSION+SAGA/@26.8225601,75.8622093,17z/data=!4m8!3m7!1s0x396dc966259bc005:0x6f80b79a5e8920d9!8m2!3d26.8225601!4d75.8622093!9m1!1b1!16s%2Fg%2F11z235wkw8?entry=ttu&g_ep=EgoyMDI2MDYxNi4wIKXMDSoASAFQAw%3D%3D";
const googleReviewsUrl = "https://www.google.com/search?q=The+Infusion+Saga+reviews";
const defaultSupportEmail = "theinfusionsaga.tis@gmail.com";
const orderNowUrl = "https://www.theinfusionsaga.com/order";
const menuUrlExternal = "https://www.theinfusionsaga.com/menu";
const nearSkitMapsUrl = "https://maps.app.goo.gl/smbVVrq7SzDcuNyK6";
const highStreetMapsUrl = "https://maps.app.goo.gl/2MEyGSRxms1SJpe59";
const mapPreviewPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'%3E%3Crect width='640' height='400' fill='%23e6e2d5'/%3E%3Cpath d='M60 220c70-50 140-50 210 0 70 50 140 50 210 0' stroke='%239b8870' stroke-width='14' fill='none'/%3E%3Cpath d='M75 120c50-40 100-40 150 0 50 40 100 40 150 0' stroke='%239b8870' stroke-width='12' fill='none'/%3E%3Ccircle cx='520' cy='120' r='46' fill='%234a0006'/%3E%3Cpath d='M520 120l0 92' stroke='%23fff' stroke-width='8'/%3E%3Cpath d='M520 90 c-18 0 -32 14 -32 32 s14 32 32 32 32-14 32-32 -14-32 -32-32z' fill='none' stroke='%23fff' stroke-width='8'/%3E%3C/svg%3E";

const defaultWebsiteContent = {
  hero: {
    title: "Welcome to The Infusion Saga",
    description: "A cozy cafe experience for conversations, comfort, and memorable flavors.",
    videoUrl: cafeHeroVideo,
    buttonText: "Explore Menu",
    buttonLink: "/menu"
  },
  about: {
    story: "The Infusion Saga began as a warm idea: to create a space where premium coffee, handcrafted bites, and heartfelt hospitality feel effortless and unforgettable. Every corner is designed for slow conversations, quick pauses, and elevated comfort.",
    vision: "To become a community favorite destination known for refined flavors, thoughtful service, and a calming atmosphere that feels both premium and personal.",
    mission: "To serve every guest with warmth, quality, and consistency—whether they arrive for a quiet coffee break, a casual meetup, or a celebratory indulgence.",
    futurePlans: "We are continuing to build memorable experiences through seasonal menu launches, curated events, and a more immersive cafe atmosphere."
  },
  whatWeServe: [
    {
      id: "default-serve-1",
      title: "Signature Chai & Coffee",
      description: "Crafted with care and served with warmth for slow mornings and quick resets.",
      image: "/assets/images/Signature-Chai&Coffee.jpg",
      icon: Coffee
    },
    {
      id: "default-serve-2",
      title: "Fresh Snacks & Comfort Bites",
      description: "A premium selection of quick bites and comfort favorites designed for all-day cravings.",
      image: "/assets/images/Fresh-Snacks.jpg",
      icon: Sandwich
    },
    {
      id: "default-serve-3",
      title: "Desserts & Sweet Escapes",
      description: "Indulgent treats made to make every pause feel a little more memorable.",
      image: "/assets/images/Desserts.jpg",
      icon: CakeSlice
    },
    {
      id: "default-serve-4",
      title: "Cozy Dine-In Experience",
      description: "A warm setting for coffee dates, catch-ups, solo downtime, and small celebrations.",
      image: "/assets/images/Dine-In-Experience.png",
      icon: CupSoda
    }
  ],
  bestFor: [
    {
      id: "default-best-1",
      title: "Couple Dates",
      description: "A calm, intimate setting for conversations over premium coffee and comfort bites.",
      image: "/assets/images/Couple-Dates.jpg",
      icon: Heart
    },
    {
      id: "default-best-2",
      title: "Study Sessions",
      description: "A peaceful atmosphere for focused work, thoughtful breaks, and a fresh cup of energy.",
      image: "/assets/images/College-Hangouts.webp",
      icon: Sparkles
    },
    {
      id: "default-best-3",
      title: "Work & Chill",
      description: "A mellow backdrop for productive hours and relaxed evenings without losing the mood.",
      image: "/assets/images/Work&Chill.png",
      icon: Utensils
    },
    {
      id: "default-best-4",
      title: "Family Time",
      description: "A welcoming space where comfort food, warm drinks, and easy conversations come together.",
      image: "/assets/images/Family-Time.jpg",
      icon: ShieldCheck
    }
  ],
  visualMoments: [
    {
      id: "default-visual-1",
      title: "Live Music Nights",
      description: "Soft melodies, warm lighting, and a space that feels effortlessly elevated.",
      videoUrl: liveMusicVideo,
      icon: Music
    },
    {
      id: "default-visual-2",
      title: "Match Screenings",
      description: "Bring your favorite games to a cozy, vibrant setting made for shared energy.",
      videoUrl: liveProjectorVideo,
      icon: Trophy
    },
    {
      id: "default-visual-3",
      title: "Evening Glow",
      description: "A calm cafe atmosphere designed for slower evenings and lingering conversations.",
      videoUrl: cafeStoryVideo,
      icon: Timer
    }
  ],
  customerReviews: [
    {
      id: "default-review-1",
      name: "Asha",
      review: "The ambience is calm, the coffee is rich, and every visit feels special.",
      rating: 5,
      videoUrl: reviewVideoOne,
      customerImage: "/assets/images/Couple-Dates.jpg"
    },
    {
      id: "default-review-2",
      name: "Rohan",
      review: "This place balances premium flavors with a really warm, personal atmosphere.",
      rating: 5,
      videoUrl: reviewVideoTwo,
      customerImage: "/assets/images/Friends-Meetup.webp"
    },
    {
      id: "default-review-3",
      name: "Meera",
      review: "Every detail feels thoughtfully curated, from the drinks to the mood of the space.",
      rating: 5,
      videoUrl: reviewVideoThree,
      customerImage: "/assets/images/Family-Time.jpg"
    }
  ],
  socialLinks: {
    instagram: instagramUrl,
    facebook: facebookUrl,
    x: twitterUrl,
    youtube: "",
    whatsapp: "",
    googleMaps: feedbackUrl,
    googleReviewUrl: "",
    website: ""
  },
  support: {
    email: defaultSupportEmail,
    phone: "",
    whatsapp: ""
  },
  fssai: {
    fileUrl: "",
    fileName: "",
    fileType: "",
    uploadedAt: ""
  }
};

const footerColumns = [
  {
    title: "QUICK LINKS",
    links: ["About The Infusion Saga", "Our Menu", "Cafe Experience", "Visit Cafe", "Contact", "Privacy Policy"]
  }
];

const legalContent = {
  terms: {
    title: "Terms & Conditions",
    body: "Orders are prepared as per cafe availability and selected options. Prices, menu items, and offers may change without prior notice. Customers are requested to review their order before payment or confirmation. The Infusion Saga may refuse or cancel orders in case of incorrect details, unavailable items, or misuse of services."
  },
  privacy: {
    title: "Privacy Policy",
    body: "We collect only the basic details needed to process orders, support requests, and cafe communication, such as name, phone number, order details, and payment status. We do not sell customer information. For privacy queries, contact theinfusionsaga.tis@gmail.com."
  },
  refund: {
    title: "Refund Policy",
    body: "Refunds, if applicable, will be reviewed for failed payments, duplicate payments, or order issues. For support, contact theinfusionsaga.tis@gmail.com."
  }
};

function SafeImage({ src, alt, className = "", fallbackSrc = "/assets/images/Signature-Chai&Coffee.jpg", width = 640, height = 480, ...props }) {
  const [currentSrc, setCurrentSrc] = React.useState(src || fallbackSrc);
  const [hasError, setHasError] = React.useState(!src);

  React.useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setHasError(!src);
  }, [src, fallbackSrc]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      onError={(event) => {
        if (hasError) return;
        setHasError(true);
        setCurrentSrc(fallbackSrc);
        event.currentTarget.onerror = null;
      }}
    />
  );
}

function SafeVideo({ src, alt, className = "", fallbackImage = null, ...props }) {
  const [currentSrc, setCurrentSrc] = React.useState("");
  const [hasError, setHasError] = React.useState(!src);
  const [isVisible, setIsVisible] = React.useState(false);
  const videoContainerRef = React.useRef(null);

  React.useEffect(() => {
    setCurrentSrc("");
    setHasError(!src);
    setIsVisible(false);

    if (!src) {
      setHasError(true);
      return;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setCurrentSrc(src);
      setIsVisible(true);
      return;
    }

    const node = videoContainerRef.current;
    if (!node) {
      setCurrentSrc(src);
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCurrentSrc(src);
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [src]);

  if (hasError) {
    if (fallbackImage) {
      return <SafeImage src={fallbackImage} alt={alt} className={className} width={640} height={420} />;
    }
    return (
      <div className={`flex h-full min-h-inherit items-center justify-center rounded-[1.5rem] border border-[#4A0006]/10 bg-[#FFF8F6] px-4 text-center ${className}`}>
        <p className="text-sm font-semibold text-stone-600">Media unavailable</p>
      </div>
    );
  }

  return (
    <div ref={videoContainerRef} className="relative h-full w-full overflow-hidden">
      {isVisible ? (
        <video
          {...props}
          src={currentSrc}
          className={className}
          onError={() => setHasError(true)}
          muted
          playsInline
          preload="metadata"
          loop
          poster={fallbackImage || undefined}
        />
      ) : (
        <SafeImage src={fallbackImage || "/assets/images/Signature-Chai&Coffee.jpg"} alt={alt} className={className} width={640} height={420} />
      )}
    </div>
  );
}

function SectionShell({ eyebrow, title, children, className = "", id, style }) {
  return (
    <section id={id} style={style} className={`about-section about-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14 ${className}`}>
      {(eyebrow || title) && (
        <div className="mb-8 max-w-3xl">
          {eyebrow && <p className="text-xs font-black uppercase tracking-[0.32em] text-[#4A0006]">{eyebrow}</p>}
          {title && <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}

function ReviewVideoCard({ video, name, review }) {
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const current = videoRef.current;
    if (!current) return;
    const handleEnded = () => setIsPlaying(false);
    current.addEventListener("ended", handleEnded);
    return () => current.removeEventListener("ended", handleEnded);
  }, []);

  const togglePlayback = () => {
    const current = videoRef.current;
    if (!current) return;
    if (current.paused) {
      current.play();
      setIsPlaying(true);
    } else {
      current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <article className="about-card rounded-[1.5rem] bg-white p-6 shadow-[0_18px_36px_rgba(74,0,6,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(74,0,6,0.18)]">
      <div className="relative overflow-hidden rounded-[1.25rem] shadow-[0_18px_36px_rgba(74,0,6,0.12)]">
        <video
          ref={videoRef}
          src={video}
          playsInline
          preload="metadata"
          className="h-52 w-full object-cover object-center sm:h-48"
        />
        <button
          type="button"
          onClick={togglePlayback}
          className="absolute inset-0 grid place-items-center bg-black/20 text-white transition duration-200 hover:bg-black/35"
          aria-label={isPlaying ? "Pause review video" : "Play review video"}
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white shadow-lg">
            {isPlaying ? "❚❚" : "▶"}
          </span>
        </button>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <p className="text-lg font-black text-stone-950">{name}</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={16} className="text-amber-500" />
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-stone-600">{review}</p>
    </article>
  );
}

function PremiumButton({ children, onClick, href, className = "" }) {
  const classes = `about-premium-button about-primary-btn group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black ${className}`;
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
  const modalRef = React.useRef(null);
  const closeRef = React.useRef(null);

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements?.length) return;
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(event) => event.stopPropagation()}
        className="about-card w-full max-w-lg bg-[rgba(255,248,244,0.92)] p-6 text-[#240003] shadow-[0_24px_48px_rgba(0,0,0,0.16)]"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-black">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#4A0006] transition hover:bg-white"
          >
            ×
          </button>
        </div>
        <div className="mt-4 text-sm font-semibold leading-7 text-stone-700">{children}</div>
      </div>
    </div>
  );
}

function VideoPlaceholder({ label, className = "", videoSrc }) {
  return (
    <div className={`about-video-card about-card group relative isolate min-h-64 overflow-hidden bg-[linear-gradient(145deg,rgba(255,250,245,0.95),rgba(255,240,232,0.85))] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.95),transparent_30%),radial-gradient(circle_at_82%_76%,rgba(74,0,6,0.12),transparent_34%),linear-gradient(135deg,rgba(17,17,17,0.03),rgba(17,17,17,0.10))] transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-5 rounded-[1.25rem] border border-[#4A0006]/10 bg-white/25" />
      <div className="relative z-10 h-full min-h-inherit">
        {videoSrc ? (
          <video
            src={videoSrc}
            className="h-full w-full rounded-[1.5rem] object-cover object-center"
            controls
            playsInline
            preload="metadata"
            loading="lazy"
            aria-label={label}
          />
        ) : (
          <div className="flex h-full min-h-inherit flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="rounded-full bg-[#FFF8F4]/80 px-5 py-2 text-sm font-black text-[#4A0006] backdrop-blur-xl">{label}</p>
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

const ServiceCard = React.memo(function ServiceCard({ item }) {
  const Icon = item.icon;
  return (
    <article className="about-service-card about-card about-lift group overflow-hidden p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4A0006]/10 text-[#4A0006]">
          {item.image ? (
            <img src={item.image} alt={item.title} className="h-12 w-12 rounded-xl object-cover" loading="lazy" decoding="async" fetchPriority="low" width={48} height={48} />
          ) : (
            <Icon size={24} />
          )}
        </div>
        <span className="about-badge px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em]">Bestseller</span>
      </div>
      <h3 className="mt-6 text-xl font-black leading-tight text-stone-950">{item.title}</h3>
      <p className="mt-3 text-sm font-semibold leading-7 text-stone-600">{item.description}</p>
    </article>
  );
});

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
  const [content, setContent] = React.useState(() => createEmptyWebsiteContent(""));
  const [loading, setLoading] = React.useState(true);
  const outletSlug = getOutletSlugFromPath();

  React.useEffect(() => {
    let isMounted = true;
    async function loadContent() {
      setLoading(true);
      try {
        const data = await api(`/website-content?outletSlug=${encodeURIComponent(outletSlug || "")}`);
        if (isMounted) setContent(normalizeWebsiteContentPayload(data, outletSlug || ""));
      } catch (error) {
        if (isMounted) setContent(createEmptyWebsiteContent(outletSlug || ""));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadContent();
    return () => { isMounted = false; };
  }, [outletSlug]);

  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pageContent = React.useMemo(() => {
    const normalized = normalizeWebsiteContentPayload(content, outletSlug || "");

    return {
      ...defaultWebsiteContent,
      ...normalized,
      hero: {
        ...defaultWebsiteContent.hero,
        ...normalized.hero,
        title: normalized.hero.title || defaultWebsiteContent.hero.title,
        description: normalized.hero.description || defaultWebsiteContent.hero.description,
        videoUrl: normalized.hero.videoUrl || defaultWebsiteContent.hero.videoUrl,
        buttonText: normalized.hero.buttonText || defaultWebsiteContent.hero.buttonText,
        buttonLink: normalized.hero.buttonLink || defaultWebsiteContent.hero.buttonLink
      },
      about: {
        ...defaultWebsiteContent.about,
        ...normalized.about,
        story: normalized.about.story || defaultWebsiteContent.about.story,
        vision: normalized.about.vision || defaultWebsiteContent.about.vision,
        mission: normalized.about.mission || defaultWebsiteContent.about.mission,
        futurePlans: normalized.about.futurePlans || defaultWebsiteContent.about.futurePlans
      },
      whatWeServe: (normalized.whatWeServe?.length ? normalized.whatWeServe : defaultWebsiteContent.whatWeServe).map((item) => ({
        ...item,
        icon: item.icon || HeartHandshake
      })),
      bestFor: (normalized.bestFor?.length ? normalized.bestFor : defaultWebsiteContent.bestFor).map((item) => ({
        ...item,
        icon: item.icon || Heart
      })),
      visualMoments: (normalized.visualMoments?.length ? normalized.visualMoments : defaultWebsiteContent.visualMoments).map((item) => ({
        ...item,
        icon: item.icon || Trophy
      })),
      customerReviews: (normalized.customerReviews?.length ? normalized.customerReviews : defaultWebsiteContent.customerReviews).map((item) => ({
        ...item,
        name: item.name || "Guest",
        review: item.review || "A memorable visit worth returning to.",
        rating: item.rating || 5,
        videoUrl: item.videoUrl || "",
        customerImage: item.customerImage || ""
      })),
      socialLinks: {
        ...defaultWebsiteContent.socialLinks,
        ...normalized.socialLinks,
        instagram: normalized.socialLinks.instagram || defaultWebsiteContent.socialLinks.instagram,
        facebook: normalized.socialLinks.facebook || defaultWebsiteContent.socialLinks.facebook,
        x: normalized.socialLinks.x || defaultWebsiteContent.socialLinks.x,
        youtube: normalized.socialLinks.youtube || defaultWebsiteContent.socialLinks.youtube,
        whatsapp: normalized.socialLinks.whatsapp || defaultWebsiteContent.socialLinks.whatsapp,
        googleMaps: normalized.socialLinks.googleMaps || defaultWebsiteContent.socialLinks.googleMaps,
        googleReviewUrl: normalized.socialLinks.googleReviewUrl || defaultWebsiteContent.socialLinks.googleReviewUrl,
        website: normalized.socialLinks.website || defaultWebsiteContent.socialLinks.website
      },
      support: {
        ...defaultWebsiteContent.support,
        ...normalized.support,
        email: normalized.support.email || defaultWebsiteContent.support.email,
        phone: normalized.support.phone || defaultWebsiteContent.support.phone,
        whatsapp: normalized.support.whatsapp || defaultWebsiteContent.support.whatsapp
      },
      fssai: {
        ...defaultWebsiteContent.fssai,
        ...normalized.fssai,
        fileUrl: normalized.fssai.fileUrl || defaultWebsiteContent.fssai.fileUrl,
        fileName: normalized.fssai.fileName || defaultWebsiteContent.fssai.fileName,
        fileType: normalized.fssai.fileType || defaultWebsiteContent.fssai.fileType,
        uploadedAt: normalized.fssai.uploadedAt || defaultWebsiteContent.fssai.uploadedAt
      }
    };
  }, [content, outletSlug]);

  const socialLinks = pageContent?.socialLinks || {};
  const supportEmail = pageContent?.support?.email || defaultSupportEmail;
  const serveItems = (pageContent?.whatWeServe || []).map((item) => ({ ...item, icon: item.icon || HeartHandshake }));
  const bestForItems = (pageContent?.bestFor || []).map((item) => ({ ...item, icon: item.icon || Heart }));
  const visualMoments = (pageContent?.visualMoments || []).map((item) => ({ ...item, icon: item.icon || Trophy }));
  const customerExperiences = (pageContent?.customerReviews || []).map((item) => ({ name: item.name, review: item.review, rating: item.rating, videoUrl: item.videoUrl, customerImage: item.customerImage }));
  const heroVideo = homePageVideo;
  const storyVideo = pageContent?.videos?.[0]?.url || pageContent?.hero?.videoUrl || "";
  const fssaiImagePath = pageContent?.fssai?.fileUrl || "/images/fssai.png";
  const ctaButtonLink = pageContent?.hero?.buttonLink || "/menu";
  const ctaButtonText = pageContent?.hero?.buttonText || "Explore Menu";
  const navTitle = pageContent?.hero?.title || "THE INFUSION SAGA";
  const storyText = pageContent?.about?.story || "The outlet story will appear here once it is published.";
  const storyVision = pageContent?.about?.vision || "";
  const storyMission = pageContent?.about?.mission || "";
  const storyFuturePlans = pageContent?.about?.futurePlans || "";
  const getBestSellerImage = (title = "") => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes("signature") && normalizedTitle.includes("chai")) {
      return signatureBestSellerImage;
    }

    if (normalizedTitle.includes("fresh") && normalizedTitle.includes("snacks")) {
      return freshSnacksBestSellerImage;
    }

    if (normalizedTitle.includes("dessert") || normalizedTitle.includes("sweet")) {
      return dessertsBestSellerImage;
    }

    return null;
  };
  const bestSellerItems = serveItems.slice(0, 3).map((item) => ({
    ...item,
    image: getBestSellerImage(item.title) || item.image || "/assets/images/Signature-Chai&Coffee.jpg"
  }));
  const featuredOutlets = [
    {
      name: "Near SKIT",
      description: "A colorful courtyard hangout for laid-back evenings and easy conversations.",
      address: "Near SKIT, Jaipur",
      timings: "Daily • 11:00 AM – 11:00 PM",
      image: nearSkitOutletImage,
      badge: "Open now",
      explorePath: "/near-skit",
      menuPath: "/menu",
      titleClassName: "max-w-[13rem] text-2xl font-black leading-tight text-white sm:text-3xl",
      gallery: [],
      heroContent: {},
      reviews: [],
      content: {},
      images: {}
    },
    {
      name: "Near High Street Capital Mall",
      description: "A rooftop garden escape with fountains, greenery, and city views above.",
      address: "Near High Street Capital Mall, Jaipur",
      timings: "Daily • 11:00 AM – 11:00 PM",
      image: nearHighStreetOutletImage,
      badge: "Open now",
      explorePath: "/near-high-street",
      menuPath: "/menu",
      titleClassName: "max-w-[13rem] whitespace-nowrap text-[1.4rem] font-black leading-tight text-white sm:text-[1.55rem]",
      gallery: [],
      heroContent: {},
      reviews: [],
      content: {},
      images: {}
    }
  ];
  const signatureExperiences = [
    { title: "Live Music", description: "Gentle evenings shaped by warm notes and a slower pace.", icon: Music },
    { title: "IPL Screening", description: "A welcoming screen-side setting built for shared energy and big matches.", icon: Trophy },
    { title: "Outdoor Seating", description: "Sunlit corners and fresh air for lingering over your favorite cup.", icon: Trees },
    { title: "Fast WiFi", description: "Reliable connectivity for work sessions, calls, and relaxed productivity.", icon: Wifi },
    { title: "Premium Coffee", description: "Handcrafted blends and thoughtful pours, served with calm confidence.", icon: Coffee },
    { title: "Cozy Ambience", description: "Soft lighting and considered details that feel instantly personal.", icon: Heart }
  ];
  const galleryItems = [
    { title: "Cozy Dine-In Experience", image: cozyDineInImage },
    { title: "Weekend Glow", image: weekendGlowImage },
    { title: "Warm Gatherings", image: warmGatheringsImage },
    { title: "Quiet Worktime", image: quietWorktimeImage }
  ];

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openExternal(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleFooterLink(link) {
    if (link === "About The Infusion Saga") scrollToSection("hero");
    if (link === "Our Menu") openExternal(menuUrlExternal);
    if (link === "Cafe Experience") scrollToSection("signature-experiences");
    if (link === "Visit Cafe") scrollToSection("featured-outlets");
    if (link === "Contact") setModal("customer-support");
    if (link === "Privacy Policy") setModal("privacy");
  }

  return (
    <main className="about-cafe-page min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#4A0006_0%,#5B0A10_45%,#240003_100%)] text-[#FFF8F4]">
      <style>{`
        .about-reveal {
          animation: aboutFadeUp 0.8s ease both;
          animation-timeline: view();
          animation-range: entry 0% cover 30%;
        }
        .about-reveal:first-of-type {
          animation-timeline: auto;
        }
        .about-card {
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 248, 244, 0.18);
          background: rgba(255, 248, 244, 0.92);
          box-shadow: 0 20px 50px rgba(74, 0, 6, 0.18);
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .about-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 28px 72px rgba(74, 0, 6, 0.22);
        }
        .about-primary-btn, .about-secondary-btn {
          min-height: 46px;
          width: 100%;
        }
        @media (min-width: 640px) {
          .about-primary-btn, .about-secondary-btn {
            width: auto;
          }
        }
        .about-primary-btn {
          border-radius: 999px;
          background: linear-gradient(135deg, #4A0006, #5B0A10);
          color: #FFF8F4;
          box-shadow: 0 18px 36px rgba(74, 0, 6, 0.24);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
        }
        .about-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 24px 48px rgba(74, 0, 6, 0.30);
          background: linear-gradient(135deg, #5B0A10, #6B1017);
        }
        .about-secondary-btn {
          border-radius: 999px;
          border: 1px solid rgba(74, 0, 6, 0.18);
          background: rgba(255, 248, 244, 0.92);
          color: #4A0006;
          box-shadow: 0 10px 24px rgba(74, 0, 6, 0.12);
          transition: transform 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
        }
        .about-secondary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 32px rgba(74, 0, 6, 0.16);
          background: rgba(255, 248, 244, 0.98);
        }
        .about-hero-fade {
          animation: aboutHeroFade 1.2s ease both;
        }
        .about-hero-video {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transform-origin: center center;
        }
        .about-hero-shell {
          position: relative;
          isolation: isolate;
          display: flex;
          width: 100vw;
          max-width: none;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #240003;
          left: 50%;
          transform: translateX(-50%);
        }
        @media (max-width: 768px) {
          .about-hero-shell {
            min-height: 90vh;
          }
        }
        @media (max-width: 480px) {
          .about-hero-shell {
            min-height: 85vh;
          }
        }
        .about-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(14, 10, 11, 0.18) 0%, rgba(14, 10, 11, 0.34) 38%, rgba(14, 10, 11, 0.54) 100%), radial-gradient(circle at center, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.06) 32%, rgba(0, 0, 0, 0.38) 100%);
        }
        .about-scroll-indicator {
          position: absolute;
          left: 50%;
          bottom: 28px;
          transform: translateX(-50%);
          z-index: 3;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: transform 0.25s ease, color 0.25s ease, filter 0.25s ease;
          cursor: pointer;
          padding: 0.75rem 0.5rem 0.2rem;
        }
        .about-scroll-indicator:hover {
          color: rgba(255, 255, 255, 0.95);
          filter: drop-shadow(0 0 14px rgba(255, 255, 255, 0.16));
        }
        .about-scroll-mouse {
          position: relative;
          display: block;
          width: 1.75rem;
          height: 2.5rem;
          border: 1.5px solid rgba(255, 255, 255, 0.7);
          border-radius: 999px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
        }
        .about-scroll-dot {
          position: absolute;
          left: 50%;
          top: 0.55rem;
          width: 0.28rem;
          height: 0.28rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.9);
          transform: translateX(-50%);
          animation: aboutScrollDot 1.5s ease-in-out infinite;
        }
        .about-scroll-chevron {
          width: 0.7rem;
          height: 0.7rem;
          border-right: 1.5px solid rgba(255, 255, 255, 0.7);
          border-bottom: 1.5px solid rgba(255, 255, 255, 0.7);
          transform: rotate(45deg) translateY(-1px);
          opacity: 0.8;
          animation: aboutScrollChevron 1.5s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .about-scroll-indicator {
            bottom: 22px;
          }
        }
        @media (max-width: 480px) {
          .about-scroll-indicator {
            bottom: 18px;
            gap: 0.3rem;
          }
          .about-scroll-mouse {
            width: 1.5rem;
            height: 2.2rem;
          }
        }
        .about-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #4A0006;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(74, 0, 6, 0.16);
        }
        @keyframes aboutFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aboutHeroFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aboutHeroVideoZoom {
          from { transform: scale(1); }
          to { transform: scale(1.04); }
        }
        @keyframes aboutScrollDot {
          0% { opacity: 0; transform: translate(-50%, -0.1rem); }
          20% { opacity: 1; }
          75% { opacity: 1; transform: translate(-50%, 0.8rem); }
          100% { opacity: 0; transform: translate(-50%, 1.2rem); }
        }
        @keyframes aboutScrollChevron {
          0%, 100% { opacity: 0.3; transform: rotate(45deg) translateY(-1px); }
          50% { opacity: 1; transform: rotate(45deg) translateY(0.2rem); }
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

      <div className="pointer-events-none fixed -left-16 top-24 h-72 w-72 rounded-full bg-[#FFF8F4]/70 blur-3xl" />      <div className="pointer-events-none fixed right-0 top-10 h-80 w-80 rounded-full bg-[#4A0006]/10 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#4A0006]/10 blur-3xl" />


      <SectionShell
        id="hero"
        style={{
          width: "100vw",
          maxWidth: "none",
          margin: 0,
          padding: 0,
          marginTop: 0,
          paddingTop: 0,
          paddingBottom: 0,
          overflow: "visible"
        }}
        className="about-hero-section"
      >
        <div className="about-hero-shell">
          <video
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="about-hero-video"
            />
          <div className="about-hero-overlay" />
          <div className="about-hero-fade relative z-10 flex max-w-3xl flex-col items-center justify-center px-6 pb-20 pt-16 text-center text-[#FFF8F4] sm:px-8 lg:px-12">
            <img src={logoUrl} alt="The Infusion Saga logo" className="mx-auto h-14 w-auto mb-3" />
            <p className="text-sm font-semibold uppercase tracking-[0.38em] text-[#F7D9C8]">PREMIUM CAFE EXPERIENCE</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">The Infusion Saga</h1>
            <p className="mt-5 text-xl font-semibold leading-8 text-[#F4E2DA] sm:text-2xl">Coffee. Conversations. Comfort.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollToSection("featured-outlets")}
                className="about-primary-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black"
              >
                Explore Outlets
                <ArrowRight size={17} />
              </button>
              <a
                href="/menu"
                className="about-secondary-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black"
              >
                View Menu
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
          <button
            type="button"
            aria-label="Scroll to featured outlets"
            onClick={() => scrollToSection("featured-outlets")}
            className="about-scroll-indicator"
          >
            <span className="about-scroll-mouse">
              <span className="about-scroll-dot" />
            </span>
            <span className="about-scroll-chevron" />
          </button>
        </div>
      </SectionShell>

      <section id="featured-outlets" className="about-section about-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#FFF8F4]">FEATURED OUTLETS</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">Two places to settle in.</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {featuredOutlets.map((outlet) => {
            const address = outlet.address || "Near SKIT, Jaipur";
            const timings = outlet.timings || "Daily • 7:00 AM – 10:30 PM";
            return (
              <article key={outlet.name} className="about-card group h-full overflow-hidden">
                <div className="relative overflow-hidden">
                  <SafeImage
                    src={outlet.image}
                    alt={outlet.name}
                    className="h-72 w-full object-cover object-center transition duration-500 group-hover:scale-105 sm:h-80"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.40)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={outlet.titleClassName || "max-w-[13rem] text-2xl font-black leading-tight text-white sm:text-3xl"}>{outlet.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6 sm:p-7">
                  <p className="text-sm font-semibold leading-7 text-stone-600">{outlet.description}</p>
                  <div className="mt-5 space-y-2 text-sm font-semibold text-stone-700">
                    <p className="flex items-center gap-2"><span className="text-stone-400">•</span>{address}</p>
                    <p className="flex items-center gap-2"><span className="text-stone-400">•</span>{timings}</p>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
                    {false && (
                      <button
                        type="button"
                        onClick={() => navigate?.(outlet.explorePath)}
                        className="about-primary-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-black"
                      >
                        Explore Outlet
                        <ArrowRight size={16} />
                      </button>
                    )}
                    {(outlet.name === "Near SKIT" || outlet.name === "Near High Street Capital Mall") ? (
                      <a
                        href={outlet.name === "Near SKIT" ? "https://maps.app.goo.gl/EeScDw7MPNmp2zos9" : "https://maps.app.goo.gl/dEBg7yvHHEQtURPF9"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-secondary-btn inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-black sm:w-auto"
                      >
                        View Location
                        <ArrowRight size={16} />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate?.(outlet.menuPath)}
                        className="about-secondary-btn inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-black sm:w-auto"
                      >
                        View Menu
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-section about-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#FFF8F4]">BEST SELLERS</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">The calm classics, refined.</h2>
        </div>
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth sm:gap-5 lg:gap-6">
          {bestSellerItems.map((item) => {
            const itemPrice = item.price ?? item.priceText ?? item.cost ?? null;
            return (
              <article key={`${item.title}-${item.description}`} className="about-card group flex h-[24rem] w-[85%] shrink-0 snap-start flex-col overflow-hidden sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="relative overflow-hidden">
                  <SafeImage
                    src={item.image || "/assets/images/Signature-Chai&Coffee.jpg"}
                    alt={item.title}
                    className="h-56 w-full object-cover object-center transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.05)_0%,rgba(10,10,10,0.45)_100%)]" />
                  <span className="about-badge absolute left-4 top-4 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em]">
                    Bestseller
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black leading-tight text-stone-950">{item.title}</h3>
                    {itemPrice ? <p className="text-sm font-black text-stone-700">₹{itemPrice}</p> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-7 text-stone-600">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href={ctaButtonLink}
            className="about-secondary-btn inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black"
          >
            View Full Menu
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section id="signature-experiences" className="about-section about-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-[#FFF8F4]">SIGNATURE EXPERIENCES</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">Thoughtful rituals throughout the day.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Cozy Ambience", description: "Soft light, calm corners, and a pause that feels personal.", media: cafeStoryVideo, image: galleryTwoImage },
            { title: "Live Music Nights", description: "Gentle rhythms that turn ordinary evenings into something memorable.", media: liveMusicVideo, image: galleryOneImage },
            { title: "Match Screenings", description: "Warm energy, shared excitement, and the perfect cafe crowd.", media: liveProjectorVideo, image: galleryThreeImage },
            { title: "Rooftop Sitting", description: "The kind of place where conversations linger a little longer.", media: rooftopVideo, image: galleryFourImage }
          ].map((item) => (
            <article key={item.title} className="about-card group h-full overflow-hidden">
              <div className="relative overflow-hidden">
                {item.media ? (
                  <SafeVideo
                    src={item.media}
                    alt={item.title}
                    className="h-60 w-full object-cover object-center transition duration-500 group-hover:scale-105"
                    fallbackImage={item.image || galleryOneImage}
                    autoPlay
                    muted
                    playsInline
                    loop
                    aria-label={item.title}
                  />
                ) : (
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-60 w-full object-cover object-center transition duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.04)_0%,rgba(10,10,10,0.48)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-black leading-tight text-white">{item.title}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold leading-7 text-stone-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#"
            aria-label="Order on Swiggy"
            className="inline-flex items-center justify-center gap-3 h-14 w-[14rem] rounded-full bg-white text-[#4A0006] shadow-[0_18px_36px_rgba(74,0,6,0.14)] transition-transform duration-200 ease-out hover:-translate-y-0.5 cursor-pointer hidden"
          >
            <img src={swiggyIcon} alt="Swiggy" className="h-6 w-6 object-contain flex-shrink-0" loading="lazy" />
            <span className="text-sm font-semibold leading-none">Order on Swiggy</span>
          </a>
          <a
            href="#"
            href="https://share.google/xRo3KIx22cFp1KpgD"
            aria-label="Order on Zomato"
            className="inline-flex items-center justify-center gap-3 h-14 w-[14rem] rounded-full bg-white text-[#4A0006] shadow-[0_18px_36px_rgba(74,0,6,0.14)] transition-transform duration-200 ease-out hover:-translate-y-0.5 cursor-pointer"
          >
            <img src={zomatoIcon} alt="Zomato" className="h-6 w-6 object-contain flex-shrink-0" loading="lazy" />
            <span className="text-sm font-semibold leading-none">Order on Zomato</span>
          </a>
        </div>
      </section>

      <section className="about-section about-reveal relative z-10 mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-white">Gallery Preview</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">A Glimpse Into The Infusion Saga</h2>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-stone-200">
            Every corner has a story. From peaceful mornings with coffee to lively evenings with friends, experience the atmosphere before you even visit.
          </p>
        </div>
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth sm:gap-5 lg:gap-6">
          {galleryItems.map((item) => (
            <article key={item.title} className="about-card group shrink-0 snap-start h-[24rem] w-[85%] overflow-hidden rounded-[1.5rem] shadow-[0_18px_40px_rgba(0,0,0,0.12)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(0,0,0,0.18)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[22rem]">
              <div className="relative h-full overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-center transition duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.40)_40%,rgba(0,0,0,0.08)_0%)] transition duration-500 group-hover:bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_40%,rgba(0,0,0,0.12)_0%)]" />
                <div className="absolute bottom-0 left-0 p-5">
                  <h3 className="text-lg font-semibold leading-tight text-white">{item.title}</h3>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-black text-[#4A0006] shadow-[0_18px_36px_rgba(74,0,6,0.14)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            View Full Gallery
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <SectionShell id="customer-reviews">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-white">CUSTOMER REVIEWS</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl lg:text-5xl">Loved By Our Guests</h2>
          <p className="mt-4 text-sm font-semibold leading-7 text-stone-200">
            From coffee dates to late-night gatherings, our guests keep coming back for the experience as much as the food.
          </p>
        </div>
        <div className="scrollbar-none flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth sm:gap-5 lg:gap-6">
          {[
            {
              name: "Ravikant Sharma",
              review: "\"Such a cozy little escape.\" — The ambience instantly puts you at ease, and the coffee here is genuinely top-notch. A must-visit if you're in the area!",
              video: reviewVideoOne
            },
            {
              name: "Harsh Desai",
              review: "\"Coffee that keeps me coming back.\" — Their infusion coffee is unlike anything else nearby, and the seating is so comfortable you won't want to leave.",
              video: reviewVideoTwo
            },
            {
              name: "Vedika",
              review: "\"A perfect evening spot.\" — The lighting and music set just the right mood. We tried the pasta and cold coffee—both were fantastic.",
              video: reviewVideoThree
            },
            {
              name: "Arpana",
              review: "\"Quick service, warm staff.\" — Even during peak hours, the team stays friendly and gets your order out fast. Really appreciated the effort.",
              video: reviewVideoFour
            }
          ].map((item) => (
            <div key={item.name} className="shrink-0 snap-start w-[85%] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[22rem]">
              <ReviewVideoCard video={item.video} name={item.name} review={item.review} />
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-black text-[#4A0006] shadow-[0_18px_36px_rgba(74,0,6,0.14)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            View All Reviews
            <ArrowRight size={16} />
          </a>
        </div>
      </SectionShell>

      <SectionShell>
        <div className="about-card relative overflow-hidden bg-[linear-gradient(135deg,rgba(255,248,244,0.92)_0%,rgba(217,185,155,0.16)_100%)] p-7 sm:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-rose-100/70 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-stone-500">Visit us</p>
              <h2 className="mt-3 text-4xl font-black leading-[0.98] text-stone-950 sm:text-5xl">
                Your next favorite coffee moment starts here.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollToSection("featured-outlets")}
                className="about-primary-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black"
              >
                Visit Outlet
                <ArrowRight size={17} />
              </button>
              <a
                href={ctaButtonLink}
                className="about-secondary-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black"
              >
                View Menu
                <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </SectionShell>

      <footer className="relative z-10 mt-8 bg-[#4A0006] px-4 py-5 text-white sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-5 border-b border-white/15 pb-4 lg:grid-cols-[1.2fr_0.85fr_1.4fr]">
            <div className="pr-0 lg:pr-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8F4EE] p-1.5 shadow-[0_8px_18px_rgba(0,0,0,0.12)]">
                  <img
                    src={logoUrl}
                    alt="The Infusion Saga logo"
                    className="h-full w-full rounded-lg object-cover opacity-95 transition duration-300 hover:opacity-100"
                  />
                </div>
                <p className="text-base font-black tracking-[0.08em] text-[#fffaf6]">THE INFUSION SAGA</p>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-6 text-white/75">
                Where Every Sip begins a Story
              </p>
              <div className="mt-4 space-y-2.5 text-sm text-white/80">
                <a href="mailto:theinfusionsaga.tis@gmail.com" className="group flex items-center gap-3 transition hover:text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[#fff0e8]">
                    <Mail size={14} />
                  </span>
                  <span>theinfusionsaga.tis@gmail.com</span>
                </a>
                <div className="flex items-center gap-3 text-white/80">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[#fff0e8]">
                    <Clock3 size={14} />
                  </span>
                  <span>
                    Open Daily
                    <span className="ml-1 text-white/60">11:00 AM – 11:00 PM</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:px-2">
              <h3 className="text-xs font-black tracking-[0.18em] text-[#fff0e8]">QUICK LINKS</h3>
              <div className="mt-4 grid gap-2">
                {footerColumns[0].links.map((link) => (
                  <button
                    key={link}
                    type="button"
                    onClick={() => handleFooterLink(link)}
                    className="w-fit text-left text-sm font-medium text-white/75 transition duration-200 hover:text-white hover:translate-x-0.5"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black tracking-[0.18em] text-[#fff0e8]">LOCATIONS</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {[
                  {
                    name: "Near SKIT",
                    address: "Near SKIT, Jaipur",
                    href: nearSkitMapsUrl,
                    alt: "Map preview for Near SKIT location",
                    image: nearSkitMapImage
                  },
                  {
                    name: "Near High Street Capital Mall",
                    address: "Near High Street Capital Mall, Jaipur",
                    href: highStreetMapsUrl,
                    alt: "Map preview for High Street Capital Mall location",
                    image: nearHighStreetMapImage
                  }
                ].map((location) => (
                  <a
                    key={location.name}
                    href={location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${location.name} in maps`}
                    className="group block overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/8 text-white shadow-[0_12px_22px_rgba(0,0,0,0.12)] transition duration-300 hover:-translate-y-1 hover:bg-white/12 hover:shadow-[0_18px_28px_rgba(0,0,0,0.18)]"
                  >
                    <div className="overflow-hidden rounded-t-[1.25rem] bg-[#fffaf6]">
                      <img
                        src={location.image}
                        alt={location.alt}
                        className="h-24 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-20 lg:h-24"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-white">{location.name}</h4>
                          <p className="mt-1 text-xs font-medium text-white/70">{location.address}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white transition group-hover:bg-white group-hover:text-[#4A0006]">
                          <MapPin size={12} />
                          Open in Maps
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3">
            <p className="text-center text-sm font-semibold text-white/70">© 2026 The Infusion Saga. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {modal === "fssai" && (
        <InfoModal title="FSSAI" onClose={() => { setModal(null); setFssaiMissing(false); }}>
          {!fssaiMissing ? (
            <SafeImage
              src={fssaiImagePath}
              alt="FSSAI certificate"
              className="max-h-[70vh] w-full rounded-2xl object-contain"
            />
          ) : (
            <p>FSSAI certificate will appear here.</p>
          )}
        </InfoModal>
      )}
      {modal === "customer-support" && (
        <InfoModal title="Customer Support" onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div>
              <p className="text-xl font-black text-stone-950">Need Help?</p>
              <p className="mt-4 text-sm leading-7 text-stone-700">
                Mail us your query at
                <span className="font-black text-stone-950"> {supportEmail}</span>
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-700">We usually respond within 24 hours.</p>
            </div>
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#4A0006] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5"
              aria-label="Send email to support"
            >
              Send Email
            </a>
          </div>
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
