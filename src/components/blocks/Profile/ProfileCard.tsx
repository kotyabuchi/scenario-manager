import { Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { isNil } from 'ramda';

import * as styles from './styles';

import type { ProfileCardProps } from './interface';

export const ProfileCard = ({
  user,
  showEditButton = false,
}: ProfileCardProps) => {
  return (
    <div className={styles.card_card}>
      <div className={styles.card_header}>
        {!isNil(user.image) && user.image !== '' && (
          <Image
            src={user.image}
            alt={`${user.nickname}のプロフィール画像`}
            width={128}
            height={128}
            className={styles.card_avatar}
          />
        )}
        <div className={styles.card_info}>
          <h2 className={styles.card_nickname}>{user.nickname}</h2>
          <p className={styles.card_userName}>@{user.userName}</p>
        </div>
      </div>

      {!isNil(user.bio) && user.bio !== '' && (
        <>
          <hr className={styles.card_divider} />
          <div>
            <h3 className={styles.card_sectionTitle}>自己紹介</h3>
            <p className={styles.card_bio}>{user.bio}</p>
          </div>
        </>
      )}

      <hr className={styles.card_divider} />
      <div>
        <div className={styles.card_metaItem}>
          <span className={styles.card_metaLabel}>権限</span>
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

      {showEditButton && (
        <div className={styles.card_editButtonWrapper}>
          <Link href="/profile" className={styles.card_editButton}>
            <Settings size={16} />
            プロフィール設定
          </Link>
        </div>
      )}
    </div>
  );
};
