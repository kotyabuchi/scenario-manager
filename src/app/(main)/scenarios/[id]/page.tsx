import { notFound } from 'next/navigation';

import { ScenarioDetailPanel } from './_components/ScenarioDetailPanel';
import { ScenarioDetailToc } from './_components/ScenarioDetailToc';
import { toggleFavoriteForCurrentUserAction } from './actions';
import { resolveScenarioListReturnTo } from './returnTo';
import { getScenarioDetailSections } from './sections';
import * as styles from './styles';
import { getScenarioDetailViewModel } from './viewModel';

export const metadata = {
  title: 'シナリオ詳細',
  description: 'シナリオの詳細情報',
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function ScenarioDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const viewModel = await getScenarioDetailViewModel(id);
  if (!viewModel) notFound();

  const backHref = resolveScenarioListReturnTo(query.returnTo);
  const sections = getScenarioDetailSections(viewModel.scenario);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageLayout}>
        <div className={styles.pageMain}>
          <ScenarioDetailToc sections={sections} variant="mobile" />
          <ScenarioDetailPanel
            {...viewModel}
            variant="page"
            backHref={backHref}
            onToggleFavorite={toggleFavoriteForCurrentUserAction.bind(null, id)}
          />
        </div>
        <ScenarioDetailToc sections={sections} variant="desktop" />
      </div>
    </div>
  );
}
