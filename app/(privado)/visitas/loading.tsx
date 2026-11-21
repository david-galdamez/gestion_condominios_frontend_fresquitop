export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando visitas"
    >
      <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-10 rounded bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
