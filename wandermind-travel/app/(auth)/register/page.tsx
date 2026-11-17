import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = { title: "Create account · WanderMind" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const { destination } = await searchParams;
  return <RegisterForm destination={destination} />;
}
