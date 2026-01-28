import * as styles from './styles';

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
