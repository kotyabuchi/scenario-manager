const SCROLL_EDGE_TOLERANCE = 1;

export const observeScrollFade = (pane: HTMLElement | null) => {
  if (!pane) return () => {};

  let frameId = 0;
  let contentElement: Element | null = null;

  const update = () => {
    const maxScrollTop = pane.scrollHeight - pane.clientHeight;
    const canScrollUp = pane.scrollTop > SCROLL_EDGE_TOLERANCE;
    const canScrollDown = maxScrollTop - pane.scrollTop > SCROLL_EDGE_TOLERANCE;

    pane.dataset.canScrollUp = String(canScrollUp);
    pane.dataset.canScrollDown = String(canScrollDown);
  };

  const scheduleUpdate = () => {
    if (frameId) return;
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      update();
    });
  };

  const resizeObserver = new ResizeObserver(scheduleUpdate);
  resizeObserver.observe(pane);

  const observeContent = () => {
    const nextContent = pane.firstElementChild;
    if (nextContent === contentElement) return;
    if (contentElement) resizeObserver.unobserve(contentElement);
    contentElement = nextContent;
    if (contentElement) resizeObserver.observe(contentElement);
  };

  const mutationObserver = new MutationObserver(() => {
    observeContent();
    scheduleUpdate();
  });
  mutationObserver.observe(pane, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  pane.addEventListener('scroll', scheduleUpdate, { passive: true });
  observeContent();
  update();

  return () => {
    pane.removeEventListener('scroll', scheduleUpdate);
    mutationObserver.disconnect();
    resizeObserver.disconnect();
    if (frameId) cancelAnimationFrame(frameId);
  };
};
