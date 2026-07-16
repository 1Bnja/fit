"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; info?: string };

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Correo o contraseña incorrectos." };

  redirect("/home");
}

export async function registro(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const nombre = String(formData.get("nombre") ?? "");
  const apellido = String(formData.get("apellido") ?? "");
  const username = String(formData.get("username") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, apellido, username } },
  });

  if (error) return { error: "No se pudo crear la cuenta. Verifica los datos." };
  if (!data.user) return { error: "No se pudo crear la cuenta." };

  if (!data.session) {
    return { info: "Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión." };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
