import { InheritForm } from "@/components/inherit-form";
import type { TokenPreset } from "@/lib/tokens";

export const metadata = {
  title: "Inherit embed",
};

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string }>;
}) {
  const params = await searchParams;
  const theme = (params.theme ?? "inherit") as TokenPreset;
  const preset =
    theme === "atelier" || theme === "northline"
      ? theme
      : theme === "host"
        ? "host"
        : "inherit";

  return (
    <div className="min-h-screen bg-transparent p-0">
      <InheritForm preset={preset} compact />
    </div>
  );
}
