import { css } from '@/styled-system/css';

const START_YEAR = 2026;

const getCopyrightYear = () => {
  const currentYear = new Date().getFullYear();
  if (currentYear <= START_YEAR) {
    return `${START_YEAR}`;
  }
  return `${START_YEAR}-${currentYear}`;
};

export const SimpleFooter = () => {
  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>
        &copy; {getCopyrightYear()} シナプレ管理くん
      </p>
    </footer>
  );
};

const styles = {
  footer: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '48px',
    bg: 'white',
  }),
  copyright: css({
    fontSize: '12px',
    fontWeight: 'normal',
    color: 'gray.400',
  }),
};
