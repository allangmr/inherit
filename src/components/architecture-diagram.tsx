export function ArchitectureDiagram() {
  return (
    <figure className="inh-arch" aria-label="Inherit architecture">
      <div className="inh-arch-node">Workflow definition</div>
      <span className="inh-arch-arrow" aria-hidden="true">
        ↓
      </span>
      <div className="inh-arch-row">
        <div className="inh-arch-node">Human UI</div>
        <div className="inh-arch-node">WebMCP tools</div>
        <div className="inh-arch-node">Validation</div>
      </div>
      <span className="inh-arch-arrow" aria-hidden="true">
        ↓
      </span>
      <div className="inh-arch-node">Shared session</div>
      <span className="inh-arch-arrow" aria-hidden="true">
        ↓
      </span>
      <div className="inh-arch-node">Domain actions</div>
    </figure>
  );
}
