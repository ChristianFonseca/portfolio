export function FloatingShapes() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-1">
      {/* Large floating circles */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse" />
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-accent/15 rounded-full blur-lg animate-bounce"
        style={{ animationDuration: "3s" }}
      />
      <div
        className="absolute bottom-32 left-1/4 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Small geometric shapes */}
      <div
        className="absolute top-1/3 right-10 w-8 h-8 bg-primary/25 rotate-45 animate-spin"
        style={{ animationDuration: "20s" }}
      />
      <div
        className="absolute bottom-1/4 right-1/3 w-6 h-6 bg-accent/35 rounded-full animate-ping"
        style={{ animationDuration: "4s" }}
      />
      <div className="absolute top-1/2 left-20 w-12 h-12 bg-secondary/20 rounded-lg rotate-12 animate-pulse" />
    </div>
  )
}
