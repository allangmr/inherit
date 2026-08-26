import { tokenPresets, type TokenPreset } from "@/lib/tokens";
import { TokenScope } from "./token-scope";

const tokenRows: Array<{ label: string; read: (preset: TokenPreset) => string; swatch?: boolean }> = [
  { label: "Primary", read: (preset) => tokenPresets[preset].colors.primary, swatch: true },
  { label: "Surface", read: (preset) => tokenPresets[preset].colors.surface, swatch: true },
  { label: "Text", read: (preset) => tokenPresets[preset].colors.text, swatch: true },
  { label: "Radius md", read: (preset) => tokenPresets[preset].radius.md },
  { label: "Type", read: (preset) => (preset === "atelier" ? "Fraunces / Source Serif" : preset === "northline" ? "IBM Plex" : "Geist") },
];

export function HostSystem({
  preset,
  client,
}: {
  preset: TokenPreset;
  client: string;
}) {
  return (
    <TokenScope preset={preset} className="mb-4">
      <section className="inh-form" style={{ padding: "var(--inh-space-md)", boxShadow: "var(--inh-shadow-sm)" }}>
        <p className="inh-kicker">
          <span>{client} design system</span>
          <span>host controls</span>
        </p>
        <p className="inh-hint" style={{ marginTop: "0.4rem" }}>
          These widgets belong to the host page. The Inherit form below uses the same{" "}
          <code className="inh-code">--inh-*</code> tokens — compare radius, type, and primary.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="inh-button" data-variant="primary">
            Host primary
          </button>
          <button type="button" className="inh-button" data-variant="ghost">
            Host ghost
          </button>
          <input className="inh-input" style={{ width: "10rem" }} defaultValue="Host input" />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          {tokenRows.map((row) => {
            const value = row.read(preset);
            return (
              <div key={row.label}>
                <dt className="inh-hint">{row.label}</dt>
                <dd className="mt-1 flex items-center gap-1.5 font-mono text-[11px]">
                  {row.swatch ? (
                    <span
                      aria-hidden="true"
                      className="inline-block h-3 w-3 rounded-sm border"
                      style={{ background: value, borderColor: "var(--inh-color-border)" }}
                    />
                  ) : null}
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </TokenScope>
  );
}
