import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] flex flex-col items-center justify-center p-6 selection:bg-[#6366F1]/30">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center mx-auto text-[#6366F1]">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
          <h2 className="text-xl font-semibold text-[#E4E4E7]">Page Not Found</h2>
          <p className="text-sm text-[#A1A1AA]">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-all shadow-lg shadow-[#6366F1]/25"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
