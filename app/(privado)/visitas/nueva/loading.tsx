export default function Loading() {
  return (
    <div
      className="flex max-w-xl animate-pulse flex-col gap-4"
      aria-busy="true"
      aria-label="Cargando formulario"
    >
      <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-10 rounded bg-zinc-200 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
