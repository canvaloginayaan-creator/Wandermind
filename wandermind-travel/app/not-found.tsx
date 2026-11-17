import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border hairline surface-2 text-sea-300">
        <Icon name="compass" size={28} />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">This one isn't on the map</h1>
      <p className="mt-2 max-w-sm text-sm fg-muted">
        The trip or page you asked for doesn't exist — or it belongs to another account.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Back to the dashboard
        <Icon name="arrowRight" size={15} />
      </Link>
    </div>
  );
}
