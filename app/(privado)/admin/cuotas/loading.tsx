export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando cuotas"
    >
      <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
