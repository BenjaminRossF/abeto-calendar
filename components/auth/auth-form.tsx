"use client";

import { useActionState, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signInAction, signUpAction, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

type AuthMode = "signin" | "signup";
const initialState: ActionState = { ok: false };

export function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const isSignIn = mode === "signin";

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">Bienvenido a Abeto</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {isSignIn ? "Entra a tu espacio" : "Crea tu cuenta"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isSignIn
            ? "Inicia sesión para gestionar tus eventos y reservas."
            : "Un par de datos y tu agenda quedará lista para compartir."}
        </p>
      </div>

      <div aria-label="Tipo de acceso" className="mb-6 grid grid-cols-2 rounded-xl bg-muted p-1" role="group">
        <button
          aria-pressed={isSignIn}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSignIn ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setMode("signin")}
          type="button"
        >
          Iniciar sesión
        </button>
        <button
          aria-pressed={!isSignIn}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${!isSignIn ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Crear cuenta
        </button>
      </div>

      <CredentialsForm key={mode} mode={mode} />

      <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        Tus datos se usan para proteger el acceso a tu agenda.
      </p>
    </div>
  );
}

function CredentialsForm({ mode }: { mode: AuthMode }) {
  const action = mode === "signin" ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSignIn = mode === "signin";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {!isSignIn ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="auth-name">Nombre</label>
          <input
            autoComplete="name"
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            id="auth-name"
            maxLength={80}
            minLength={2}
            name="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="auth-email">Correo electrónico</label>
        <input
          autoComplete="email"
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          id="auth-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="auth-password">Contraseña</label>
        <input
          autoComplete={isSignIn ? "current-password" : "new-password"}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
          id="auth-password"
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        {!isSignIn ? <p className="text-xs text-muted-foreground">Usa al menos 8 caracteres.</p> : null}
      </div>

      {state.error ? (
        <p aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p aria-live="polite" className="rounded-lg border border-border bg-muted px-3 py-2 text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button className="mt-1 h-11 w-full" disabled={pending} size="lg" type="submit">
        {pending ? <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" data-icon="inline-start" /> : null}
        {pending ? "Un momento…" : isSignIn ? "Iniciar sesión" : "Crear cuenta"}
        {!pending ? <ArrowRight aria-hidden="true" data-icon="inline-end" /> : null}
      </Button>
    </form>
  );
}
