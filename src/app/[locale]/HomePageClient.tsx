"use client";

import { useState, Suspense, lazy } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Camera,
  Car,
  Check,
  ChevronDown,
  CircleDot,
  Clock,
  CloudLightning,
  Crosshair,
  Crown,
  Flag,
  Gamepad2,
  Globe,
  HeartPulse,
  KeyRound,
  ListChecks,
  Lock,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Mountain,
  Move,
  MoveRight,
  Package,
  Palette,
  Rocket,
  Route,
  Satellite,
  Scale,
  Server,
  Shield,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  UserPlus,
  Volume2,
  Waves,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

// Conditionally render text as a link or plain span (no internal links until articles exist)
function LinkedTitle({
  linkData,
  children,
  className,
  locale,
}: {
  linkData: { url: string; title: string } | null | undefined;
  children: React.ReactNode;
  className?: string;
  locale: string;
}) {
  if (linkData) {
    const href = locale === "en" ? linkData.url : `/${locale}${linkData.url}`;
    return (
      <Link
        href={href}
        className={`${className || ""} hover:text-[hsl(var(--nav-theme-light))] hover:underline decoration-[hsl(var(--nav-theme-light))/0.4] underline-offset-4 transition-colors`}
        title={linkData.title}
      >
        {children}
      </Link>
    );
  }
  return <>{children}</>;
}

// Module section header (eyebrow + title + subtitle + intro)
function ModuleHeader({
  eyebrow,
  title,
  subtitle,
  intro,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  intro?: string;
}) {
  return (
    <div className="text-center mb-8 md:mb-12 scroll-reveal">
      {eyebrow && (
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 md:mb-4 text-xs md:text-sm font-medium bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))] uppercase tracking-wider">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4 leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
      {intro && (
        <p className="text-sm md:text-base text-muted-foreground max-w-3xl mx-auto mt-3 md:mt-4 leading-relaxed">
          {intro}
        </p>
      )}
    </div>
  );
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

// Maps Tools Grid card index -> section anchor id (8 modules)
const SECTION_IDS = [
  "beginner-guide",
  "items-tier-list",
  "maps-shortcuts",
  "multiplayer-friends-guide",
  "controls-and-shot-guide",
  "release-date-and-platforms",
  "achievements-and-cosmetic-unlocks",
  "updates-and-patch-notes",
] as const;

// Distinct lucide icons for each module's sub-items (no repeats within a module)
const BEGINNER_STEP_ICONS = [
  Target,
  Crosshair,
  MoveRight,
  Flag,
  Package,
  Zap,
  HeartPulse,
  Trophy,
  ListChecks,
];
const ITEM_CATEGORY_ICONS: Record<string, typeof Target> = {
  Railgun: Crosshair,
  "Orbital Laser": Satellite,
  Thunderstorm: CloudLightning,
  "Smoke Bomb": Wind,
  "Launch Items": Rocket,
  "Flash Camera": Camera,
  "Jumbo Burger": Shield,
};
const ROUTE_ICONS = [
  Flag,
  MapPin,
  Mountain,
  Waves,
  Route,
  Timer,
  ArrowDownToLine,
  Target,
];
const MULTIPLAYER_STEP_ICONS = [
  Globe,
  Server,
  UserPlus,
  KeyRound,
  Volume2,
  Swords,
  Scale,
  Wrench,
];
const CONTROL_SECTION_ICONS = [
  Move,
  Target,
  Package,
  Car,
  Flag,
  CircleDot,
  Swords,
];
const ACHIEVEMENT_ICONS = [
  Flag,
  Trophy,
  Target,
  CircleDot,
  Swords,
  Zap,
  Wind,
  Car,
  Package,
  Lock,
  Sparkles,
  Crown,
];
const UPDATE_TYPE_ICONS: Record<string, typeof Rocket> = {
  "Full Release": Rocket,
  "Platform Roadmap": Gamepad2,
  "Weapons and Utility Items": Swords,
  "Content Update": MapIcon,
  "Balance Patch": Scale,
  Customization: Palette,
  "Technical Update": Wrench,
  "Current Version": Clock,
};

// Status badge for the platforms table
function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Available" || status === "Published"
      ? "bg-[hsl(var(--nav-theme)/0.15)] border-[hsl(var(--nav-theme)/0.4)] text-[hsl(var(--nav-theme-light))]"
      : status === "Announced"
        ? "bg-[hsl(142_71%_45%/0.12)] border-[hsl(142_71%_45%/0.4)] text-[hsl(142_71%_60%)]"
        : "bg-white/5 border-border text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
}

// Difficulty / rarity tone mapping for achievements
const DIFFICULTY_TONE: Record<string, string> = {
  Easy: "bg-[hsl(142_71%_45%/0.12)] border-[hsl(142_71%_45%/0.4)] text-[hsl(142_71%_60%)]",
  Medium:
    "bg-[hsl(var(--nav-theme)/0.12)] border-[hsl(var(--nav-theme)/0.4)] text-[hsl(var(--nav-theme-light))]",
  Hard: "bg-[hsl(0_72%_50%/0.12)] border-[hsl(0_72%_50%/0.4)] text-[hsl(0_72%_65%)]",
  Variable:
    "bg-white/5 border-border text-muted-foreground",
};

export default function HomePageClient({
  latestArticles,
  moduleLinkMap,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.super-battle-golf.wiki";

  // Accordion states for modules that collapse
  const [controlsOpen, setControlsOpen] = useState<number | null>(0);
  const [updatesOpen, setUpdatesOpen] = useState<number | null>(0);
  const mobileBannerAd = getPreferredMobileBannerSelection();

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Super Battle Golf Wiki",
        description:
          "Explore Super Battle Golf courses, items, achievements, controls, team mode, cosmetics, updates, and beginner tips for faster wins on every chaotic hole.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Super Battle Golf - Chaotic Multiplayer Golf",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Super Battle Golf Wiki",
        alternateName: "Super Battle Golf",
        url: siteUrl,
        description:
          "Super Battle Golf Wiki resource hub for courses, items, achievements, multiplayer, cosmetics, controls, and update guides",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Super Battle Golf Wiki - Chaotic Multiplayer Golf",
        },
        sameAs: [
          "https://store.steampowered.com/app/4069520/Super_Battle_Golf/",
          "https://brimstone.games/",
          "https://www.youtube.com/@brimstonedevs",
          "https://x.com/BrimstoneDevs",
          "https://steamcommunity.com/app/4069520",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Super Battle Golf",
        gamePlatform: ["PC", "Steam"],
        applicationCategory: "Game",
        genre: ["Sports", "Arcade", "Multiplayer", "Party"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 8,
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://store.steampowered.com/app/4069520/Super_Battle_Golf/",
        },
      },
      {
        "@type": "VideoObject",
        name: "Super Battle Golf | Official Release Trailer",
        description:
          "Official Super Battle Golf release trailer showcasing chaotic 1-8 player multiplayer golf with weapons, items, and sabotage.",
        uploadDate: "2026-02-19",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/NOp0NEELsrg",
        url: "https://www.youtube.com/watch?v=NOp0NEELsrg",
      },
    ],
  };

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                          bg-[hsl(var(--nav-theme)/0.1)]
                          border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("updates-and-patch-notes")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <Clock className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://store.steampowered.com/app/4069520/Super_Battle_Golf/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnSteamCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* ============ Video (autoplay via IntersectionObserver) ============ */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="NOp0NEELsrg"
              title="Super Battle Golf | Official Release Trailer"
            />
          </div>
        </div>
      </section>

      {/* ============ Tools Grid - 8 Navigation Cards ============ */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = SECTION_IDS[index];
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                                bg-[hsl(var(--nav-theme)/0.1)]
                                flex items-center justify-center
                                group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                transition-colors"
                  >
                    <DynamicIcon
                      name={card.icon}
                      className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm md:text-base font-semibold">
                    {card.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Latest Updates (kept module; renders null when no articles yet) ============ */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* ============ Module 1: Super Battle Golf Beginner Guide (steps) ============ */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.beginnerGuide.eyebrow}
            title={t.modules.beginnerGuide.title}
            subtitle={t.modules.beginnerGuide.subtitle}
            intro={t.modules.beginnerGuide.intro}
          />

          <div className="scroll-reveal space-y-3 md:space-y-4 mb-8 md:mb-10">
            {t.modules.beginnerGuide.steps.map((step: any, index: number) => {
              const Icon = BEGINNER_STEP_ICONS[index % BEGINNER_STEP_ICONS.length];
              return (
                <div
                  key={index}
                  className="flex gap-3 md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--nav-theme)/0.4)] bg-[hsl(var(--nav-theme)/0.15)]">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                      <span className="text-[hsl(var(--nav-theme-light))] text-sm font-semibold">
                        {index + 1}.
                      </span>
                      <LinkedTitle
                        linkData={moduleLinkMap[`beginnerGuide::steps::${index}`]}
                        locale={locale}
                      >
                        {step.title}
                      </LinkedTitle>
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    {step.tips && step.tips.length > 0 && (
                      <ul className="space-y-1.5">
                        {step.tips.map((tip: string, ti: number) => (
                          <li key={ti} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Tips */}
          <div className="scroll-reveal p-4 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">Quick Tips</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {t.modules.beginnerGuide.quickTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* ============ Module 2: Super Battle Golf Item Tier List (tiers) ============ */}
      <section id="items-tier-list" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.itemsTierList.eyebrow}
            title={t.modules.itemsTierList.title}
            subtitle={t.modules.itemsTierList.subtitle}
            intro={t.modules.itemsTierList.intro}
          />

          <div className="scroll-reveal space-y-6">
            {t.modules.itemsTierList.tiers.map((tier: any, ti: number) => {
              const tierTone =
                tier.tier === "S"
                  ? "bg-[hsl(var(--nav-theme))] text-white border-[hsl(var(--nav-theme))]"
                  : tier.tier === "A"
                    ? "bg-[hsl(var(--nav-theme)/0.7)] text-white border-[hsl(var(--nav-theme)/0.7)]"
                    : "bg-[hsl(var(--nav-theme)/0.35)] text-white border-[hsl(var(--nav-theme)/0.5)]";
              return (
                <div
                  key={ti}
                  className="rounded-2xl border border-border overflow-hidden bg-white/[0.02]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 md:p-5 border-b border-border bg-white/[0.03]">
                    <div
                      className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold border ${tierTone}`}
                    >
                      {tier.tier}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base md:text-lg">
                        {tier.label}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
                    {tier.entries.map((entry: any, ei: number) => {
                      const Icon =
                        ITEM_CATEGORY_ICONS[entry.name] || Crosshair;
                      return (
                        <div
                          key={ei}
                          className="p-4 md:p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                              <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                            </div>
                            <div>
                              <h4 className="font-bold leading-tight">
                                <LinkedTitle
                                  linkData={
                                    moduleLinkMap[
                                      `itemsTierList::tiers::${ti}::entries::${ei}`
                                    ]
                                  }
                                  locale={locale}
                                >
                                  {entry.name}
                                </LinkedTitle>
                              </h4>
                              <span className="text-xs text-[hsl(var(--nav-theme-light))]">
                                {entry.category}
                              </span>
                            </div>
                          </div>
                          <dl className="space-y-2 text-sm">
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Strengths
                              </dt>
                              <dd className="text-muted-foreground">
                                {entry.strengths}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Best Use
                              </dt>
                              <dd className="text-muted-foreground">
                                {entry.bestUse}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Weakness
                              </dt>
                              <dd className="text-muted-foreground">
                                {entry.weakness}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Module 3: Super Battle Golf Maps and Shortcuts (route cards) ============ */}
      <section id="maps-shortcuts" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.mapsShortcuts.eyebrow}
            title={t.modules.mapsShortcuts.title}
            subtitle={t.modules.mapsShortcuts.subtitle}
            intro={t.modules.mapsShortcuts.intro}
          />

          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.mapsShortcuts.routes.map((route: any, index: number) => {
              const Icon = ROUTE_ICONS[index % ROUTE_ICONS.length];
              const riskTone =
                /Very High|High/.test(route.riskLevel) && !/Low/.test(route.riskLevel)
                  ? "bg-[hsl(0_72%_50%/0.12)] border-[hsl(0_72%_50%/0.4)] text-[hsl(0_72%_65%)]"
                  : /Medium/.test(route.riskLevel)
                    ? "bg-[hsl(var(--nav-theme)/0.12)] border-[hsl(var(--nav-theme)/0.4)] text-[hsl(var(--nav-theme-light))]"
                    : "bg-[hsl(142_71%_45%/0.12)] border-[hsl(142_71%_45%/0.4)] text-[hsl(142_71%_60%)]";
              return (
                <div
                  key={index}
                  className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors flex flex-col"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                      <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${riskTone}`}
                    >
                      {route.riskLevel} risk
                    </span>
                  </div>
                  <h3 className="font-bold mb-1">
                    <LinkedTitle
                      linkData={moduleLinkMap[`mapsShortcuts::routes::${index}`]}
                      locale={locale}
                    >
                      {route.name}
                    </LinkedTitle>
                  </h3>
                  <p className="text-xs text-[hsl(var(--nav-theme-light))] uppercase tracking-wider mb-3">
                    {route.routeType}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {route.recommendedRoute}
                  </p>

                  <div className="mt-auto space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-foreground mb-1">Hazards</p>
                      <div className="flex flex-wrap gap-1.5">
                        {route.hazards.map((h: string, hi: number) => (
                          <span
                            key={hi}
                            className="inline-flex items-center rounded-md border border-border bg-white/5 px-2 py-0.5 text-muted-foreground"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Useful Items</p>
                      <div className="flex flex-wrap gap-1.5">
                        {route.usefulItems.map((it: string, ii: number) => (
                          <span
                            key={ii}
                            className="inline-flex items-center rounded-md border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-[hsl(var(--nav-theme-light))]"
                          >
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 pt-1">
                      <MapPinned className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">Shortcut: </span>
                        {route.shortcut}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Module 4: Super Battle Golf Multiplayer Guide (steps) ============ */}
      <section id="multiplayer-friends-guide" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.multiplayerGuide.eyebrow}
            title={t.modules.multiplayerGuide.title}
            subtitle={t.modules.multiplayerGuide.subtitle}
            intro={t.modules.multiplayerGuide.intro}
          />

          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.multiplayerGuide.steps.map((step: any, index: number) => {
              const Icon =
                MULTIPLAYER_STEP_ICONS[index % MULTIPLAYER_STEP_ICONS.length];
              return (
                <div
                  key={index}
                  className="p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--nav-theme)/0.4)] bg-[hsl(var(--nav-theme)/0.15)]">
                      <Icon className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold mb-1.5">
                        <span className="text-[hsl(var(--nav-theme-light))] text-sm font-semibold">
                          {index + 1}.
                        </span>
                        <LinkedTitle
                          linkData={
                            moduleLinkMap[`multiplayerGuide::steps::${index}`]
                          }
                          locale={locale}
                        >
                          {step.title}
                        </LinkedTitle>
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground mb-3">
                        {step.description}
                      </p>

                      {step.modes && step.modes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                          {step.modes.map((mode: any, mi: number) => (
                            <div
                              key={mi}
                              className="p-3 rounded-lg border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.06)]"
                            >
                              <p className="font-semibold text-sm text-[hsl(var(--nav-theme-light))] mb-1">
                                {mode.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {mode.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.points && step.points.length > 0 && (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1">
                          {step.points.map((pt: string, pi: number) => (
                            <li key={pi} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                              <span className="text-muted-foreground text-sm">
                                {pt}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 广告位 5: 移动端横幅 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* ============ Module 5: Super Battle Golf Controls Guide (accordion) ============ */}
      <section id="controls-and-shot-guide" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.controlsGuide.eyebrow}
            title={t.modules.controlsGuide.title}
            subtitle={t.modules.controlsGuide.subtitle}
            intro={t.modules.controlsGuide.intro}
          />

          <div className="scroll-reveal space-y-3">
            {t.modules.controlsGuide.sections.map((section: any, index: number) => {
              const Icon =
                CONTROL_SECTION_ICONS[index % CONTROL_SECTION_ICONS.length];
              const isOpen = controlsOpen === index;
              return (
                <div
                  key={index}
                  className="border border-border rounded-xl overflow-hidden bg-white/[0.02]"
                >
                  <button
                    onClick={() => setControlsOpen(isOpen ? null : index)}
                    className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-white/5 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                      <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <span className="font-semibold text-base flex-1">
                      {section.name}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 md:px-5 pb-4 md:pb-5">
                      {section.type === "controls" ? (
                        <div className="overflow-x-auto -mx-1 px-1">
                          <table className="w-full text-sm border-collapse min-w-[480px]">
                            <thead>
                              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                                <th className="py-2 pr-3 font-semibold">Action</th>
                                <th className="py-2 pr-3 font-semibold">Keyboard / Mouse</th>
                                <th className="py-2 pr-3 font-semibold">Controller</th>
                              </tr>
                            </thead>
                            <tbody>
                              {section.controls.map((c: any, ci: number) => (
                                <tr
                                  key={ci}
                                  className="border-b border-border/60 align-top"
                                >
                                  <td className="py-2.5 pr-3 font-medium">
                                    {c.action}
                                  </td>
                                  <td className="py-2.5 pr-3 text-muted-foreground">
                                    {c.keyboard}
                                  </td>
                                  <td className="py-2.5 pr-3 text-muted-foreground">
                                    {c.controller}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <ul className="mt-3 space-y-1.5">
                            {section.controls.map((c: any, ci: number) => (
                              <li
                                key={ci}
                                className="flex items-start gap-2 text-xs text-muted-foreground"
                              >
                                <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                                <span>
                                  <span className="font-medium text-foreground">
                                    {c.action}:{" "}
                                  </span>
                                  {c.tip}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {section.techniques.map((tech: any, ti2: number) => (
                            <div
                              key={ti2}
                              className="p-4 rounded-lg border border-border bg-white/5"
                            >
                              <h4 className="font-semibold text-sm text-[hsl(var(--nav-theme-light))] mb-1.5">
                                {tech.name}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                {tech.instructions}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Best for:{" "}
                                </span>
                                {tech.bestFor}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Module 6: Super Battle Golf Release Date and Platforms (table) ============ */}
      <section id="release-date-and-platforms" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.releasePlatforms.eyebrow}
            title={t.modules.releasePlatforms.title}
            subtitle={t.modules.releasePlatforms.subtitle}
            intro={t.modules.releasePlatforms.intro}
          />

          <div className="scroll-reveal overflow-x-auto rounded-xl border border-border bg-white/[0.02]">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-white/[0.04] border-b border-border">
                  <th className="p-3 md:p-4 font-semibold">Platform</th>
                  <th className="p-3 md:p-4 font-semibold">Status</th>
                  <th className="p-3 md:p-4 font-semibold">Release</th>
                  <th className="p-3 md:p-4 font-semibold">Price</th>
                  <th className="p-3 md:p-4 font-semibold">Storefront</th>
                </tr>
              </thead>
              <tbody>
                {t.modules.releasePlatforms.platforms.map((p: any, index: number) => (
                  <tr key={index} className="border-b border-border/60 align-top">
                    <td className="p-3 md:p-4 font-medium">{p.platform}</td>
                    <td className="p-3 md:p-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 md:p-4 text-muted-foreground">{p.release}</td>
                    <td className="p-3 md:p-4 text-muted-foreground">{p.price}</td>
                    <td className="p-3 md:p-4 text-muted-foreground">{p.storefront}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="scroll-reveal mt-5 p-4 md:p-5 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">
                PC System Requirements
              </h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {t.modules.releasePlatforms.requirements.map((r: string, ri: number) => (
                <li key={ri} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ Module 7: Super Battle Golf Achievements and Cosmetics (category cards) ============ */}
      <section id="achievements-and-cosmetic-unlocks" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.achievements.eyebrow}
            title={t.modules.achievements.title}
            subtitle={t.modules.achievements.subtitle}
            intro={t.modules.achievements.intro}
          />

          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.modules.achievements.categories.map((cat: any, index: number) => {
              const Icon = ACHIEVEMENT_ICONS[index % ACHIEVEMENT_ICONS.length];
              const diffTone =
                DIFFICULTY_TONE[cat.difficulty] || DIFFICULTY_TONE.Variable;
              return (
                <div
                  key={index}
                  className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                      <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold leading-tight">
                        <LinkedTitle
                          linkData={moduleLinkMap[`achievements::categories::${index}`]}
                          locale={locale}
                        >
                          {cat.category}
                        </LinkedTitle>
                      </h3>
                      <p className="text-xs text-muted-foreground">{cat.rarity}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${diffTone}`}
                    >
                      {cat.difficulty}
                    </span>
                  </div>

                  <ul className="space-y-1 mb-3">
                    {cat.objectives.map((o: string, oi: number) => (
                      <li key={oi} className="flex items-start gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{o}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Strategy: </span>
                      {cat.strategy}
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Reward: </span>
                      {cat.reward}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Module 8: Super Battle Golf Updates and Patch Notes (accordion) ============ */}
      <section id="updates-and-patch-notes" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <ModuleHeader
            eyebrow={t.modules.updatesPatchNotes.eyebrow}
            title={t.modules.updatesPatchNotes.title}
            subtitle={t.modules.updatesPatchNotes.subtitle}
            intro={t.modules.updatesPatchNotes.intro}
          />

          <div className="scroll-reveal relative pl-6 md:pl-8 border-l-2 border-[hsl(var(--nav-theme)/0.3)] space-y-4">
            {t.modules.updatesPatchNotes.updates.map((upd: any, index: number) => {
              const Icon =
                UPDATE_TYPE_ICONS[upd.type] || Sparkles;
              const isOpen = updatesOpen === index;
              return (
                <div key={index} className="relative">
                  <div className="absolute -left-[1.6rem] md:-left-[2.1rem] w-4 h-4 rounded-full bg-[hsl(var(--nav-theme))] border-2 border-background" />
                  <div className="rounded-xl border border-border bg-white/[0.02] overflow-hidden">
                    <button
                      onClick={() => setUpdatesOpen(isOpen ? null : index)}
                      className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-white/5 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                        <Icon className="h-5 w-5 text-[hsl(var(--nav-theme-light))]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm md:text-base">
                            {upd.version}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-[hsl(var(--nav-theme)/0.3)] bg-[hsl(var(--nav-theme)/0.1)] px-2 py-0.5 text-xs text-[hsl(var(--nav-theme-light))]">
                            {upd.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {upd.date}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 md:px-5 pb-4 md:pb-5">
                        <p className="text-sm font-semibold mb-3">
                          {upd.headline}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {upd.newContent && upd.newContent.length > 0 && (
                            <div>
                              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--nav-theme-light))] mb-2">
                                <Sparkles className="w-3.5 h-3.5" /> New Content
                              </p>
                              <ul className="space-y-1">
                                {upd.newContent.map((n: string, ni: number) => (
                                  <li
                                    key={ni}
                                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                  >
                                    <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                                    {n}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {upd.balance && upd.balance.length > 0 && (
                            <div>
                              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--nav-theme-light))] mb-2">
                                <Scale className="w-3.5 h-3.5" /> Balance
                              </p>
                              <ul className="space-y-1">
                                {upd.balance.map((b: string, bi: number) => (
                                  <li
                                    key={bi}
                                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                  >
                                    <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {upd.fixes && upd.fixes.length > 0 && (
                            <div>
                              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--nav-theme-light))] mb-2">
                                <Wrench className="w-3.5 h-3.5" /> Fixes
                              </p>
                              <ul className="space-y-1">
                                {upd.fixes.map((f: string, fi: number) => (
                                  <li
                                    key={fi}
                                    className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                  >
                                    <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FAQ Section ============ */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* ============ CTA Section ============ */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* ============ Footer ============ */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://store.steampowered.com/app/4069520/Super_Battle_Golf/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamStore}
                  </a>
                </li>
                <li>
                  <a
                    href="https://steamcommunity.com/app/4069520"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.steamCommunity}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@brimstonedevs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    Official YouTube
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/BrimstoneDevs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
