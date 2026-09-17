import { Trip } from "../../types";
import { formatCLP, formatDate } from "../../utils/format";
import { ChevronRight } from "lucide-react";

export function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  return (
    <div
      onClick={onPress}
      className="flex items-center justify-between py-4 border-b last:border-0 cursor-pointer hover:bg-black/5"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <p className="text-sm font-bold text-foreground leading-tight">
          {trip.origin} <span className="font-normal text-muted-foreground mx-0.5">a</span> {trip.destination || "-"}
        </p>
        <p className="text-[11px] font-semibold text-muted-foreground mt-1 uppercase tracking-wider">
          {formatDate(trip.date)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-base font-bold" style={{ color: "var(--primary)" }}>
          {formatCLP(trip.amount)}
        </p>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>
    </div>
  );
}
