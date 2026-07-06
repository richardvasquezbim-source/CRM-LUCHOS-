"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { loginAction, type LoginFormState } from "@/app/login/actions";

const initialState: LoginFormState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border p-6"
      >
        <div>
          <h1 className="text-lg font-semibold">Prendas</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá la contraseña para entrar.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input id="password" name="password" type="password" required autoFocus />
          <FieldError errors={state.error ? [{ message: state.error }] : []} />
        </Field>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
