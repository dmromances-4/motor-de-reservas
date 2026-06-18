import { BookingWidget } from "@/components/booking/booking-widget";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ promo?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { promo } = await searchParams;

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--bg-2)" }}
    >
      <BookingWidget slug={slug} initialPromoCode={promo ?? ""} />
    </main>
  );
}
