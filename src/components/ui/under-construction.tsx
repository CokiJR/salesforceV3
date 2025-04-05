
import { AlertCircle } from "lucide-react";

interface UnderConstructionProps {
  title: string;
  description?: string;
}

export function UnderConstruction({ title, description }: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <div className="rounded-full bg-yellow-100 p-3 text-yellow-600 mb-4">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground max-w-md">
          {description}
        </p>
      )}
    </div>
  );
}
