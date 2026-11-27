import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Admin login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next && next.startsWith("/admin") ? next : "/admin"} />;
}
