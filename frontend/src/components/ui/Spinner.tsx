export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin"
        style={{ borderTopColor: "var(--primary)" }}
      />
    </div>
  );
}
