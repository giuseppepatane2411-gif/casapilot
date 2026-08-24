import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function GuimmiaFloatingGuide() {
  return (
    <Link
      href="/guimmia"
      aria-label="Chiedi aiuto a Guimmia"
      className="fixed bottom-5 right-5 z-40 inline-flex min-h-[52px] items-center gap-2 rounded-full border border-white/20 bg-blue-600 px-4 py-3 text-sm font-black text-white shadow-[0_16px_45px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:bg-blue-700 sm:bottom-7 sm:right-7 sm:px-5"
    >
      <MessageCircle size={19} aria-hidden="true" />
      <span className="hidden sm:inline">Hai bisogno? Chiedi a Guimmia</span>
      <span className="sm:hidden">Guimmia</span>
    </Link>
  );
}
