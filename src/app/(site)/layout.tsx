import { FaRegHeart } from "react-icons/fa6";

import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="pt-24 pb-20">
        {children}
      </main>
      <footer className="border-t border-[rgba(15,23,42,0.07)] bg-[rgba(255,255,255,0.75)] py-10">
        <div className="container flex flex-col gap-6 text-sm text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} AyyCode. All rights reserved.</p>
          <p>Made with <FaRegHeart className="inline text-red-600 font-bold"/> by mioNacs</p>
        </div>
      </footer>
    </>
  );
}
