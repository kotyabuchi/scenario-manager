import * as styles from '../styles';

// TODO: 動的データソース（CMS/DB）に移行予定。現在はハードコードの仮データ
const notices = [
  {
    id: '1',
    title: 'シナプレ管理くん v1.0 リリース',
    text: 'TRPGセッション管理ツールの初版をリリースしました。フィードバックをお待ちしています。',
  },
];

export const SystemNotice = () => {
  return (
    <div>
      <h3 className={styles.notice_heading}>お知らせ</h3>
      {notices.map((notice) => (
        <div key={notice.id} className={styles.notice_card}>
          <span className={styles.notice_cardTitle}>{notice.title}</span>
          {notice.text}
        </div>
      ))}
    </div>
  );
};
