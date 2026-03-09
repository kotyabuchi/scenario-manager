import {
  CheckCircleIcon,
  MegaphoneIcon,
  Prohibit,
  SpinnerIcon,
  WrenchIcon,
} from '@phosphor-icons/react/ssr';

import * as styles from '../styles';

import { SessionPhases } from '@/db/enum';

type SessionPhaseStepperProps = {
  phase: string;
};

const FLOW_STEPS = [
  SessionPhases.RECRUITING,
  SessionPhases.PREPARATION,
  SessionPhases.IN_PROGRESS,
  SessionPhases.COMPLETED,
] as const;

const getPhaseLabel = (phase: string): string => {
  switch (phase) {
    case SessionPhases.RECRUITING.value:
      return SessionPhases.RECRUITING.label;
    case SessionPhases.PREPARATION.value:
      return SessionPhases.PREPARATION.label;
    case SessionPhases.IN_PROGRESS.value:
      return SessionPhases.IN_PROGRESS.label;
    case SessionPhases.COMPLETED.value:
      return SessionPhases.COMPLETED.label;
    case SessionPhases.CANCELLED.value:
      return SessionPhases.CANCELLED.label;
    default:
      return phase;
  }
};

const StepIcon = ({
  phase,
  isActive,
}: {
  phase: (typeof FLOW_STEPS)[number]['value'];
  isActive: boolean;
}) => {
  const iconColor = isActive ? 'currentColor' : 'currentColor';
  const size = 20;

  switch (phase) {
    case SessionPhases.RECRUITING.value:
      return (
        <MegaphoneIcon
          size={size}
          weight={isActive ? 'fill' : 'regular'}
          color={iconColor}
        />
      );
    case SessionPhases.PREPARATION.value:
      return (
        <WrenchIcon
          size={size}
          weight={isActive ? 'fill' : 'regular'}
          color={iconColor}
        />
      );
    case SessionPhases.IN_PROGRESS.value:
      return (
        <SpinnerIcon
          size={size}
          weight={isActive ? 'bold' : 'regular'}
          color={iconColor}
        />
      );
    case SessionPhases.COMPLETED.value:
      return (
        <CheckCircleIcon
          size={size}
          weight={isActive ? 'fill' : 'regular'}
          color={iconColor}
        />
      );
    default:
      return null;
  }
};

export const SessionPhaseStepper = ({ phase }: SessionPhaseStepperProps) => {
  const currentIndex = FLOW_STEPS.findIndex((step) => step.value === phase);
  const isCancelled = phase === SessionPhases.CANCELLED.value;
  const currentLabel = getPhaseLabel(phase);

  return (
    <section
      className={styles.phaseOverview}
      aria-label="セッション進行フェーズ"
    >
      <div className={styles.phaseOverview_header}>
        <div>
          <p className={styles.phaseOverview_label}>セッション進行</p>
          <p className={styles.phaseOverview_title}>現在のフェーズ</p>
        </div>
        <span
          className={styles.phaseOverview_statusBadge({
            cancelled: isCancelled,
          })}
        >
          {isCancelled && <Prohibit size={14} weight="fill" />}
          {currentLabel}
        </span>
      </div>

      <div className={styles.phaseOverview_trackWrap}>
        <ol className={styles.phaseOverview_track}>
          {FLOW_STEPS.map((step, index) => {
            const isCompleted = !isCancelled && currentIndex > index;
            const isCurrent = !isCancelled && currentIndex === index;
            const isConnectorDone = !isCancelled && currentIndex >= index + 1;

            return (
              <li key={step.value} className={styles.phaseOverview_trackItem}>
                {index < FLOW_STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className={styles.phaseOverview_stepConnector({
                      done: isConnectorDone,
                    })}
                  />
                )}

                <div className={styles.phaseOverview_stepBlock}>
                  <div
                    className={styles.phaseOverview_stepCircle({
                      state: isCompleted
                        ? 'done'
                        : isCurrent
                          ? 'current'
                          : 'pending',
                    })}
                  >
                    <StepIcon
                      phase={step.value}
                      isActive={isCompleted || isCurrent}
                    />
                  </div>
                  <div className={styles.phaseOverview_stepText}>
                    <span
                      className={styles.phaseOverview_stepLabel({
                        state: isCompleted
                          ? 'done'
                          : isCurrent
                            ? 'current'
                            : 'pending',
                      })}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className={styles.phaseOverview_stepHint}>
                        現在
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {isCancelled && (
        <p className={styles.phaseOverview_cancelNote}>
          このセッションはキャンセルされました。必要に応じて参加者への連絡と関連リンクの整理を行ってください。
        </p>
      )}
    </section>
  );
};

export type { SessionPhaseStepperProps };
