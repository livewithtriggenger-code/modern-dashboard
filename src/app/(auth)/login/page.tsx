import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | NexusAI CRM",
};

export default function LoginPage() {
  return <LoginForm />;
}
