export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando asambleas"
    >
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 max-w-full rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-5 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-12 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-9 w-28 self-end rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}