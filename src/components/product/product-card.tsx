"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categoryMap } from "@/data/categories";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product, ProductBadge } from "@/types";

const PLACEHOLDER = "/images/placeholder-bouquet.svg";

const badgeMap: Record<
  ProductBadge,
  { label: string; variant: "default" | "accent" | "muted" }
> = {
  "best-seller": { label: "Best Seller", variant: "default" },
  new: { label: "New", variant: "accent" },
  "sold-out": { label: "Sold Out", variant: "muted" },
};

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const cat = categoryMap[product.category];
  // is_available=false sudah di-filter di RLS untuk publik. Sold-out =
  // produk tetap tampil tapi tombol order disabled. `unavailable` di sini
  // tetap defensif kalau dipakai dari konteks admin yang masih melihat
  // produk hidden.
  const isSoldOut = product.badge === "sold-out";
  const isUnavailable = !product.isAvailable;
  const dim = isSoldOut || isUnavailable;

  const cover =
    product.images?.find(
      (src) => typeof src === "string" && src.trim().length > 0,
    ) ?? PLACEHOLDER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
    >
      <Link
        href={`/produk/${product.slug}`}
        className={cn(
          "group block overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all",
          "hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
          "focus-visible:-translate-y-1 focus-visible:border-primary/40 focus-visible:shadow-lg focus-visible:outline-none",
        )}
        aria-label={`${product.name} — ${formatCurrency(product.price)}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          <Image
            src={cover}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-500 group-hover:scale-[1.06]",
              dim && "grayscale-[35%]",
            )}
          />

          {/* Badge top-left: best-seller / new / sold-out */}
          {product.badge && (
            <div className="absolute left-3 top-3">
              <Badge variant={badgeMap[product.badge].variant}>
                {badgeMap[product.badge].label}
              </Badge>
            </div>
          )}

          {/* Sold-out overlay */}
          {isSoldOut && (
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/35 via-transparent to-transparent p-3">
              <span className="rounded-full bg-white/95 px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-sm">
                Stok Habis
              </span>
            </div>
          )}

          {/* Hover CTA hint (desktop only) */}
          <div className="pointer-events-none absolute right-3 top-3 hidden translate-y-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100 md:inline-flex md:items-center md:gap-1">
            Detail
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>

        <div className="space-y-1.5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {cat?.name}
          </p>
          <h3 className="line-clamp-2 font-serif text-base font-semibold leading-snug tracking-tight md:text-lg">
            {product.name}
          </h3>
          <p className="pt-1 text-sm font-semibold text-foreground">
            {formatCurrency(product.price)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
