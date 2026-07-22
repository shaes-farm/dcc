import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Developer Control Center
        </h1>
        <p className="max-w-md text-muted-foreground">
          The application shell is up. Panels, the service rail, and the command
          palette land on top of it.
        </p>
      </div>
      <p className="font-mono text-sm text-muted-foreground">127.0.0.1:7777</p>
      <Button variant="outline" disabled>
        No workspace configured
      </Button>
    </main>
  );
}
