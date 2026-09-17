import { MapPinOff } from "lucide-react";

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <MapPinOff size={48} strokeWidth={1.5} />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
