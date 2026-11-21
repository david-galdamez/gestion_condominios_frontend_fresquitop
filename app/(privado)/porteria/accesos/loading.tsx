export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando accesos"
    >
      <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 max-w-xl rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
