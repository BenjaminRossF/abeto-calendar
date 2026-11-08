"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type ActionState = {
  ok: boolean;
  error?: string;
  success?: string;
};

const initialError = (error: string): ActionState => ({ ok: false, error });

export async function signInAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");

  if (!isEmail(email) || password.length < 8 || password.length > 128) {
    return initialError("Revisa el correo y la contraseña e inténtalo de nuevo.");
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch {
    return initialError("El correo o la contraseña no son correctos.");
  }

  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = readText(formData, "name");
  const email = readText(formData, "email").toLowerCase();
  const password = readText(formData, "password");

  if (name.length < 2 || name.length > 80) {
    return initialError("Escribe tu nombre (entre 2 y 80 caracteres).");
  }
  if (!isEmail(email)) return initialError("Escribe un correo válido.");
  if (password.length < 8 || password.length > 128) {
    return initialError("La contraseña debe tener entre 8 y 128 caracteres.");
  }

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch {
    return initialError(
      "No pudimos crear la cuenta. Revisa tus datos o prueba iniciar sesión.",
    );
  }

  redirect("/dashboard");
}

export async function signOutAction(_formData: FormData): Promise<void> {
  void _formData;
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
