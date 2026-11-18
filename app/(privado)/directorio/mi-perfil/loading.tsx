export default function Loading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6"
      aria-busy="true"
      aria-label="Cargando tu perfil"
    >
      <div className="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
