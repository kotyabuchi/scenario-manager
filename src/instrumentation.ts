export const register = async () => {
  const { setupLogger } = await import('@/lib/logger');
  await setupLogger();
};
