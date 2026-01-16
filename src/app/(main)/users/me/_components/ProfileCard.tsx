import Image from 'next/image';
import { isNil } from 'ramda';

import * as styles from './styles';

import type { ProfileCardProps } from '../interface';

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <div className={styles.card_card}>
      <div className={styles.card_header}>
        {!isNil(user.image) && user.image !== '' && (
          <Image
            src={user.image}
            alt={user.nickname}
            width={80}
            height={80}
            className={styles.card_avatar}
          />
        )}
        <div className={styles.card_info}>
          <h2 className={styles.card_nickname}>{user.nickname}</h2>
          <p className={styles.card_userName}>@{user.userName}</p>
        </div>
      </div>

      {!isNil(user.bio) && user.bio !== '' && (
        <div className={styles.card_bioSection}>
          <h3 className={styles.card_sectionTitle}>自己紹介</h3>
          <p className={styles.card_bio}>{user.bio}</p>
        </div>
      )}

      <div className={styles.card_meta}>
        <div className={styles.card_metaItem}>
          <span className={styles.card_metaLabel}>ロール</span>
          <span className={styles.card_metaValue}>
            {user.role === 'MODERATOR' ? 'モデレーター' : 'メンバー'}
          </span>
        </div>
        {!isNil(user.lastloginAt) && (
          <div className={styles.card_metaItem}>
            <span className={styles.card_metaLabel}>最終ログイン</span>
            <span className={styles.card_metaValue}>
              {new Date(user.lastloginAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
