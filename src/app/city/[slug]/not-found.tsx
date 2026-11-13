import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-16 max-w-md p-10 text-center">
      <Image src="/weather-icons/not-available.svg" alt="" width={96} height={96} unoptimized className="mx-auto" />
      <h1 className="mt-2 text-2xl font-semibold">City not found</h1>
      <p className="mt-1 text-muted">We couldn&apos;t find that place. Try searching for it instead.</p>
      <Link href="/" className="mt-6 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
        Back to dashboard
      </Link>
    </div>
  );
}
