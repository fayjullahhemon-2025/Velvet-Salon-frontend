import {
  ArrowRight,
  Eye,
  Flower2,
  Gem,
  Moon,
  Palette,
  Scissors,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Service } from "@/types/service";

interface ServiceCategoriesProps {
  services?: Service[];
}

interface CategoryInfo {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    title: "Haircut & Styling",
    description:
      "Precision cuts, blowouts, layering, and signature styling for every hair type.",
    icon: Scissors,
    tag: "Popular",
  },
  {
    title: "Hair Coloring",
    description:
      "Hand-painted balayage, dimensional highlights, root touch-ups, and gloss toners.",
    icon: Palette,
    tag: "Trending",
  },
  {
    title: "Hair Treatment",
    description:
      "Restorative keratin smoothing, deep hydration, and scalp rejuvenation therapies.",
    icon: Sparkles,
    tag: "Nourish",
  },
  {
    title: "Facial & Skincare",
    description:
      "Customized purifying facials, gentle exfoliation, and radiant glow boosters.",
    icon: Flower2,
    tag: "Glow",
  },
  {
    title: "Makeup",
    description:
      "Flawless bridal, evening glam, and photoshoot makeup tailored to your features.",
    icon: Eye,
    tag: "Glamour",
  },
  {
    title: "Manicure & Pedicure",
    description:
      "Gel polish, nail artistry, cuticle care, and nourishing hand and foot spa rituals.",
    icon: Gem,
    tag: "Care",
  },
  {
    title: "Spa & Massage",
    description:
      "Aromatherapy relaxation, tension-relief back massage, and full-body wellness.",
    icon: Moon,
    tag: "Relax",
  },
];

export default function ServiceCategories({
  services = [],
}: ServiceCategoriesProps) {
  // Count active services per category
  const activeCountMap = services
    .filter((s) => s.status === "active")
    .reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {});

  return (
    <section
      className="bg-bg-canvas/60 py-16 sm:py-24 border-t border-border-subtle"
      id="categories"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-accent-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bg-accent-brand">
            <Sparkles className="size-3.5" aria-hidden />
            Curated Services
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg-primary sm:text-4xl">
            Explore Services by Category
          </h2>
          <p className="mt-3 text-base text-fg-muted sm:text-lg">
            Choose from our specialized beauty disciplines designed to pamper,
            refresh, and redefine your look.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const count = activeCountMap[cat.title] || 0;
            const categoryUrl = `/services?category=${encodeURIComponent(cat.title)}`;

            return (
              <Link
                key={cat.title}
                href={categoryUrl}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-bg-accent-brand hover:shadow-md"
              >
                <div>
                  {/* Top Bar with Icon and Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-bg-canvas text-bg-accent-brand transition-colors group-hover:bg-bg-accent-brand group-hover:text-fg-on-accent">
                      <cat.icon
                        className="size-6 transition-transform group-hover:scale-110"
                        aria-hidden
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-border-subtle text-[11px] font-medium text-fg-muted group-hover:border-bg-accent-brand/50"
                    >
                      {cat.tag}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-fg-primary group-hover:text-bg-accent-brand transition-colors">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted line-clamp-3">
                    {cat.description}
                  </p>
                </div>

                {/* Bottom link info */}
                <div className="mt-6 flex items-center justify-between border-t border-border-subtle/50 pt-4">
                  <span className="text-xs font-medium text-fg-muted">
                    {count > 0
                      ? `${count} active ${count === 1 ? "treatment" : "treatments"}`
                      : "Browse all"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-bg-accent-brand group-hover:translate-x-0.5 transition-transform">
                    <span>Explore</span>
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
