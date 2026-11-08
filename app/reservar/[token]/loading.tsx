import { PublicBookingSkeleton } from "@/components/public-booking/public-booking-skeleton";

export default function PublicBookingLoading() {
  return (
    <main className="min-h-screen bg-muted px-4 py-5 text-foreground sm:px-6 sm:py-6 md:h-svh md:min-h-0 md:overflow-hidden">
      <div className="mx-auto w-full max-w-6xl md:h-full">
        <PublicBookingSkeleton />
      </div>
    </main>
  );
}
