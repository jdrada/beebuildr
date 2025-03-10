import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
