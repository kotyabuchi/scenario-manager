import * as styles from './styles';

type SystemBadgeProps = {
  system: {
    name: string;
    color: 'green' | 'purple' | 'orange' | 'blue' | 'red';
  };
  size?: 'sm' | 'md';
};

const colorMap = {
  green: '#059568',
  purple: '#9659DA',
  orange: '#A57230',
  blue: '#437BD9',
  red: '#D54443',
};

export const SystemBadge = ({ system, size = 'md' }: SystemBadgeProps) => {
  const bgColor = colorMap[system.color];

  return (
    <span
      role="img"
      aria-label={`システム: ${system.name}`}
      className={styles.badge(size)}
      style={{ backgroundColor: bgColor }}
      data-color={system.color}
      data-size={size}
    >
      {system.name}
    </span>
  );
};

export type { SystemBadgeProps };
