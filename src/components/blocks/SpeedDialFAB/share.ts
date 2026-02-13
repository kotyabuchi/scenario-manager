export const shareCurrentPage = async (): Promise<'share' | 'clipboard'> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: document.title,
        url: location.href,
      });
      return 'share';
    } catch {
      // Fall through to clipboard
    }
  }

  await navigator.clipboard.writeText(location.href);
  return 'clipboard';
};
