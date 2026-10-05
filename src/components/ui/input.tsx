import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("field-control", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("field-control min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("field-control pr-10", className)} {...props} />;
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("field-label", className)} {...props} />;
}

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/**
 * A labelled form field. The label is always linked to the control (htmlFor/id),
 * and the hint or error is announced with it (aria-describedby).
 */
export function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactNode;
}) {
  const autoId = useId();
  const child = Children.only(children);
  const control = isValidElement<ControlProps>(child) ? child : null;
  const id = control?.props.id ?? `field-${autoId}`;
  const noteId = `${id}-note`;
  const describedBy = hint || error ? noteId : undefined;

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="optional"> (optional)</span> : null}
      </label>
      {control
        ? cloneElement(control as ReactElement<ControlProps>, {
            id,
            "aria-describedby": describedBy,
            "aria-invalid": error ? true : undefined,
          })
        : children}
      {error ? (
        <p id={noteId} className="field-error">
          {error}
        </p>
      ) : hint ? (
        <p id={noteId} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
