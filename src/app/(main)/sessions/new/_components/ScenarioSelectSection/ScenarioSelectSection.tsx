import { useFormContext } from 'react-hook-form';
import {
  BookOpenTextIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react/ssr';
import dynamic from 'next/dynamic';

import * as styles from '../styles';
import { ScenarioSelectedCard } from './ScenarioSelectedCard';

import { Button } from '@/components/elements/button/button';
import { useToggleState } from '@/hooks/use-toggle-state';

import type { ScenarioSummary, SystemSummary } from '../../interface';
import type { SessionFormInput } from '../../schema';
import type { ParticipantType } from '../ParticipantsSection/MemberListItem';

const ScenarioSearchModal = dynamic(
  () => import('./ScenarioSearchModal').then((mod) => mod.ScenarioSearchModal),
  { ssr: false },
);

type ScenarioSelectSectionProps = {
  systems: SystemSummary[];
  selectedScenario: ScenarioSummary | null;
  onSelect: (scenario: ScenarioSummary | null) => void;
  invitedMembers: Array<{
    userId: string;
    participantType: ParticipantType;
  }>;
};

export const ScenarioSelectSection = ({
  systems,
  selectedScenario,
  onSelect,
  invitedMembers,
}: ScenarioSelectSectionProps) => {
  const { register } = useFormContext<SessionFormInput>();
  const [isSearchModalOpen, toggleSearchModalOpen, , setSearchModalClosed] =
    useToggleState(false);

  return (
    <section className={styles.form_section}>
      <h2 className={styles.form_sectionHeader}>
        <BookOpenTextIcon className={styles.form_sectionIcon} />
        シナリオ
      </h2>
      <input type="hidden" {...register('scenarioId')} />
      {selectedScenario ? (
        <ScenarioSelectedCard
          scenario={selectedScenario}
          onClear={() => onSelect(null)}
          onChange={toggleSearchModalOpen}
        />
      ) : (
        <div className={styles.scenario_emptyState}>
          <p className={styles.text_body}>
            未定（後から設定することもできます）
          </p>
          <p className={styles.text_secondary}>
            シナリオが決まっている場合は検索してください
          </p>
          <Button
            type="button"
            variant="subtle"
            onClick={toggleSearchModalOpen}
            prefix={<MagnifyingGlassIcon size={18} />}
          >
            シナリオを検索
          </Button>
        </div>
      )}
      <ScenarioSearchModal
        open={isSearchModalOpen}
        onOpenChange={(details) => {
          if (!details.open) setSearchModalClosed();
        }}
        onSelect={onSelect}
        systems={systems}
        invitedMembers={invitedMembers}
      />
    </section>
  );
};
