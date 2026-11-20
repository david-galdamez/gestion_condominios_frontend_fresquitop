export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando disponibilidad"
    >
      <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 max-w-xl rounded bg-zinc-200 dark:bg-zinc-800" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
