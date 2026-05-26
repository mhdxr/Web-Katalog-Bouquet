import { Hero } from "@/components/home/hero";
import { CategorySection } from "@/components/home/category-section";
import { FeaturedProducts } from "@/components/home/featured-products";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { HowToOrder } from "@/components/home/how-to-order";

/**
 * ISR safety net: jika tag cache tidak ter-revalidate karena suatu hal
 * (mis. server action gagal di edge yang berbeda), halaman ini akan
 * tetap re-render setiap 60 detik. Update admin yang sukses memanggil
 * `revalidateTag("products")` akan jauh lebih cepat dari ini.
 */
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <CategorySection />
      <TestimonialsSection />
      <HowToOrder />
    </>
  );
}
