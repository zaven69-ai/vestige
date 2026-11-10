import React from "react";
import { catiaPreviewExport } from "../../lib/avatars/catiaModule";

/** Metro's literal require stays deferred until this child is rendered inside
 * CatiaViewerBoundary. No import() promise/default interop reaches React.lazy.
 * A top-level native import here would bypass that boundary on module failure.
 */
export function Catia3DPreviewLoader() {
  const [Preview] = React.useState(() =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Defer native module evaluation until inside the error boundary.
    catiaPreviewExport(require("./Catia3DPreview")),
  );
  return <Preview />;
}
