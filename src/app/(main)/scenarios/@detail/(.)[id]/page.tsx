import { notFound } from 'next/navigation';

import { InterceptedDetailPresence } from '../../_components/InterceptedDetailPresence';
import { ScenarioDetailPanel } from '../../[id]/_components/ScenarioDetailPanel';
import { ScenarioDetailToc } from '../../[id]/_components/ScenarioDetailToc';
import { toggleFavoriteForCurrentUserAction } from '../../[id]/actions';
import { resolveScenarioListReturnTo } from '../../[id]/returnTo';
import { getScenarioDetailSections } from '../../[id]/sections';
import { getScenarioDetailViewModel } from '../../[id]/viewModel';
import * as styles from '../../styles';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function InterceptedScenarioDetailPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const viewModel = await getScenarioDetailViewModel(id);
  if (!viewModel) notFound();

  const backHref = resolveScenarioListReturnTo(query.returnTo);
  const sections = getScenarioDetailSections(viewModel.scenario);

  return (
    <InterceptedDetailPresence>
      <div className={styles.narrowOnlyToc}>
        <ScenarioDetailToc sections={sections} variant="mobile" />
      </div>
      <ScenarioDetailPanel
        {...viewModel}
        variant="pane"
        backHref={backHref}
        onToggleFavorite={toggleFavoriteForCurrentUserAction.bind(null, id)}
      />
    </InterceptedDetailPresence>
  );
}
