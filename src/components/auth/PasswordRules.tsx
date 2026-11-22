"use client";

import { cn } from "cn";
import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/password";

export default function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="grid gap-1.5" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const satisfied = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs",
              satisfied ? "text-fg-primary" : "text-fg-muted",
            )}
          >
            {satisfied ? (
              <Check className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="size-3.5 shrink-0" aria-hidden />
            )}
            <span>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
