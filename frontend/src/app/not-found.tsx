import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold text-[#0A0F1E] mb-4">404</h1>
      <p className="text-[#64748B] mb-8">Page not found</p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#1E90FF] text-white rounded-lg font-medium hover:bg-[#1578d4] transition-colors"
      >
        Back to CareerInk
      </Link>
    </div>
  );
}
