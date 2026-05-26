import { Facebook, Instagram, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig, type SocialLink, type SocialPlatform } from "@/config/site";

/**
 * Reusable social media link list. Selalu pakai `siteConfig.socialLinks`
 * — jangan hardcode URL Instagram/Facebook di komponen mana pun.
 *
 * Variant:
 *  - `icon`  → tombol bulat icon-only (cocok untuk footer & navbar).
 *  - `inline`→ icon + handle teks (cocok untuk contact list).
 */

const ICONS: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
};

interface SocialLinksProps {
  /** Override list. Default: dari siteConfig. */
  links?: SocialLink[];
  variant?: "icon" | "inline";
  className?: string;
  iconClassName?: string;
}

export function SocialLinks({
  links,
  variant = "icon",
  className,
  iconClassName,
}: SocialLinksProps) {
  const items = (links ?? siteConfig.socialLinks).filter((l) => l.url);
  if (items.length === 0) return null;

  if (variant === "inline") {
    return (
      <ul className={cn("space-y-3 text-sm text-muted-foreground", className)}>
        {items.map((s) => {
          const Icon = ICONS[s.platform];
          return (
            <li key={s.platform}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="inline-flex items-center gap-2 hover:text-foreground"
              >
                <Icon className={cn("h-4 w-4 text-primary", iconClassName)} />
                <span>{s.handle}</span>
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className={cn("flex items-center gap-2", className)}>
      {items.map((s) => {
        const Icon = ICONS[s.platform];
        return (
          <li key={s.platform}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-white text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Icon className={cn("h-4 w-4", iconClassName)} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
