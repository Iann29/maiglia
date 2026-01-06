import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Link href="/" className="fixed top-[9px] left-1/2 -translate-x-1/2 z-50">
        <Image
          src="/maiglia.svg"
          alt="Maiglia"
          width={80}
          height={80}
          priority
        />
      </Link>
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  );
}
