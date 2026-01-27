import { css } from '@/styled-system/css';

type SystemBadgeProps = {
  system: {
    name: string;
    color: 'green' | 'purple' | 'orange' | 'blue' | 'red';
  };
  size?: 'sm' | 'md';
};

const colorMap = {
  green: '#10B981',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  blue: '#3B82F6',
  red: '#EF4444',
};

export const SystemBadge = ({ system, size = 'md' }: SystemBadgeProps) => {
  const bgColor = colorMap[system.color];

  return (
    <span
      role="img"
      aria-label={`システム: ${system.name}`}
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        color: 'white',
        borderRadius: '0 0 8px 0',
        ...(size === 'sm'
          ? {
              fontSize: '10px',
              padding: '4px 8px',
            }
          : {
              fontSize: '11px',
              padding: '6px 12px',
            }),
      })}
      style={{ backgroundColor: bgColor }}
      data-color={system.color}
      data-size={size}
    >
      {system.name}
    </span>
  );
};

export type { SystemBadgeProps };
