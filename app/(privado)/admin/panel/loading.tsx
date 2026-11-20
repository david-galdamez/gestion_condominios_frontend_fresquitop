export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando panel de salud del condominio"
    >
      <div className="h-8 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-80 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
