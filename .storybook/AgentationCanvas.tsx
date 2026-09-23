import { lazy, Suspense, useLayoutEffect, useState } from 'react';

import { agentationPreviewPath } from './storybookAgentationPaths';

// Agentation は import 時に CSS を挿入する。開発用 Canvas 以外では読み込まない。
const Agentation = lazy(() =>
  import('agentation').then(({ Agentation: Component }) => ({
    default: Component,
  })),
);

const ENDPOINT = 'http://127.0.0.1:4747';

export const AgentationCanvas = ({ storyId }: { storyId: string }) => {
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const path = agentationPreviewPath(storyId);
    if (window.location.pathname !== path) {
      const url = new URL(window.location.href);
      url.pathname = path;
      window.history.replaceState(window.history.state, '', url);
    }
    setIsReady(true);
  }, [storyId]);

  if (!isReady) return null;

  return (
    <Suspense fallback={null}>
      <Agentation endpoint={ENDPOINT} />
    </Suspense>
  );
};
