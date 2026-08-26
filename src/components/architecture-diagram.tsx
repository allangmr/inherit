export function ArchitectureDiagram() {
  return (
    <figure className="inh-arch" aria-label="Inherit architecture">
      <div className="inh-arch-node">Inherit SDK</div>
      <span className="inh-arch-arrow" aria-hidden="true">
        ↓
      </span>
      <div className="inh-arch-row">
        <div className="inh-arch-node">defineWorkflow</div>
        <div className="inh-arch-node">Runtime</div>
        <div className="inh-arch-node">WebMCP adapter</div>
      </div>
      <span className="inh-arch-arrow" aria-hidden="true">
        ↓
      </span>
      <div className="inh-arch-node">Shared session</div>
      <span className="inh-arch-arrow" aria-hidden="true">
        ↓
      </span>
      <div className="inh-arch-node">App domain handlers</div>
    </figure>
  );
}
