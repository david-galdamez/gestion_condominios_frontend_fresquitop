export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando reportes"
    >
      <div className="h-8 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-28 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-9 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 rounded bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}