import type ts from 'typescript';
import type {
  InventoryEdge,
  InventoryNode,
  SourceLocation,
} from '../inventorySchema';
import type { SourceContext } from '../source';
import type { FunctionNode, SourceIndex } from '../sourceIndex';
import type {
  SurfaceBinding,
  SurfaceDiagnostic,
  SurfaceEntry,
  SurfaceFlowStep,
  SurfaceSite,
} from '../surfaceSchema';

/** Frameはmountごとに別instanceとし、供給側の式と一緒に運ぶ。 */
type Frame = { ownerId: string; mountSiteIds: readonly string[] };
type EntryRoot = { entry: SurfaceEntry; node: FunctionNode };
type BoundValue =
  | {
      kind: 'bound';
      expression: ts.Expression;
      frame: Frame;
      source: SourceLocation;
    }
  | { kind: 'absent' }
  | { kind: 'unknown'; node: ts.Node };
type Candidate = {
  entry: SurfaceEntry;
  site: SurfaceSite;
  frame: Frame;
  value: BoundValue;
  renderFlow: readonly SurfaceFlowStep[];
};
type ReadProp = (
  frame: Frame,
  reference: ts.Expression,
) => BoundValue | undefined;
type SurfaceExtractionInput = {
  context: SourceContext;
  index: SourceIndex;
  roots: EntryRoot[];
};
type SurfaceExtraction = {
  sites: SurfaceSite[];
  candidates: Candidate[];
  diagnostics: SurfaceDiagnostic[];
  readProp: ReadProp;
};
type CallbackResolutionInput = {
  context: SourceContext;
  index: SourceIndex;
  candidates: Candidate[];
  readProp: ReadProp;
  nodes: InventoryNode[];
  edges: InventoryEdge[];
};
type CallbackResolution = {
  bindings: SurfaceBinding[];
  diagnostics: SurfaceDiagnostic[];
};

export type {
  BoundValue,
  CallbackResolution,
  CallbackResolutionInput,
  Candidate,
  EntryRoot,
  Frame,
  ReadProp,
  SurfaceExtraction,
  SurfaceExtractionInput,
};
