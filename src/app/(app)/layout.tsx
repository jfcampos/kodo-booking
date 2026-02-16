import { Header } from "@/components/layout/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
    </>
  );
}
