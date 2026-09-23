import type { Plugin } from 'vite';

const PREVIEW_PATH = /^\/__agentation__\/story\/[^/]+\/iframe\.html$/;

export const agentationPreviewPath = (storyId: string) =>
  `/__agentation__/story/${encodeURIComponent(storyId)}/iframe.html`;

/** Story別パスで開いたプレビューへ、通常のStorybook iframeを返す。 */
export const rewriteAgentationPreviewUrl = (requestUrl: string) => {
  const url = new URL(requestUrl, 'http://localhost');
  if (!PREVIEW_PATH.test(url.pathname)) return null;
  return `/iframe.html${url.search}`;
};

export const storybookAgentationPaths = (): Plugin => ({
  name: 'storybook-agentation-paths',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const previewUrl =
        request.url && rewriteAgentationPreviewUrl(request.url);
      if (!previewUrl) return next();

      try {
        const preview = await fetch(
          `http://127.0.0.1:${request.socket.localPort}${previewUrl}`,
        );
        response.writeHead(preview.status, {
          'content-type': preview.headers.get('content-type') ?? 'text/html',
        });
        response.end(
          (await preview.text()).replace(
            '<base target="_parent" />',
            '<base href="/" target="_parent" />',
          ),
        );
      } catch (error) {
        next(error);
      }
    });
  },
});
