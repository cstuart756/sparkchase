import { clsx } from "clsx";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";

export const Card = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("rounded-xl border border-slate-200 bg-white shadow-sm", className)} {...p} />
);
export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("border-b border-slate-100 px-5 py-4", className)} {...p} />
);
export const CardBody = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("px-5 py-4", className)} {...p} />
);

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
};
export function Button({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-blue-800 text-white hover:bg-blue-900",
        variant === "outline" && "border border-slate-300 bg-white hover:bg-slate-50",
        variant === "ghost" && "hover:bg-slate-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className,
      )}
      {...p}
    />
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  invoiced: "bg-blue-100 text-blue-800",
  overdue: "bg-amber-100 text-amber-900",
  paid: "bg-green-100 text-green-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", STATUS_STYLES[status] ?? STATUS_STYLES.pending)}>
      {status}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded bg-slate-200", className)} />;
}