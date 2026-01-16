import Image from 'next/image';
import { isNil } from 'ramda';

import { css } from '@/styled-system/css';

import type { ProfileCardProps } from '../interface';

export const ProfileCard = ({ user }: ProfileCardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {!isNil(user.image) && user.image !== '' && (
          <Image
            src={user.image}
            alt={user.nickname}
            width={80}
            height={80}
            className={styles.avatar}
          />
        )}
        <div className={styles.info}>
          <h2 className={styles.nickname}>{user.nickname}</h2>
          <p className={styles.userName}>@{user.userName}</p>
        </div>
      </div>

      {!isNil(user.bio) && user.bio !== '' && (
        <div className={styles.bioSection}>
          <h3 className={styles.sectionTitle}>自己紹介</h3>
          <p className={styles.bio}>{user.bio}</p>
        </div>
      )}

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>ロール</span>
          <span className={styles.metaValue}>
            {user.role === 'MODERATOR' ? 'モデレーター' : 'メンバー'}
          </span>
        </div>
        {!isNil(user.lastloginAt) && (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>最終ログイン</span>
            <span className={styles.metaValue}>
              {new Date(user.lastloginAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: css({
    bg: 'white',
    borderRadius: 'xl',
    boxShadow: 'md',
    p: '6',
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    gap: '4',
    mb: '6',
  }),
  avatar: css({
    w: '80px',
    h: '80px',
    borderRadius: 'full',
    border: '3px solid',
    borderColor: 'gray.200',
  }),
  info: css({
    flex: '1',
  }),
  nickname: css({
    fontSize: 'xl',
    fontWeight: 'bold',
    color: 'gray.900',
  }),
  userName: css({
    fontSize: 'sm',
    color: 'gray.500',
  }),
  bioSection: css({
    borderTop: '1px solid',
    borderColor: 'gray.100',
    pt: '4',
    mb: '4',
  }),
  sectionTitle: css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'gray.700',
    mb: '2',
  }),
  bio: css({
    fontSize: 'sm',
    color: 'gray.600',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  }),
  meta: css({
    display: 'flex',
    gap: '6',
    borderTop: '1px solid',
    borderColor: 'gray.100',
    pt: '4',
  }),
  metaItem: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '1',
  }),
  metaLabel: css({
    fontSize: 'xs',
    color: 'gray.400',
  }),
  metaValue: css({
    fontSize: 'sm',
    color: 'gray.700',
  }),
};
