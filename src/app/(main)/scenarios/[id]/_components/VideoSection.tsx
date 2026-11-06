'use client';

import { Fragment, useState } from 'react';
import {
  EyeSlash,
  FilmSlate,
  PlayCircle,
  Plus,
} from '@phosphor-icons/react/ssr';
import Image from 'next/image';
import Link from 'next/link';

import * as styles from './styles';

import { Switch } from '@/components/elements/switch';

import type { VideoLinkWithSession } from '../interface';

type VideoSectionProps = {
  videos: VideoLinkWithSession[];
  isPlayed: boolean;
};

/**
 * YouTube動画IDを抽出する
 */
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
};

/**
 * プラットフォームを判定する
 */
const getPlatform = (url: string): 'youtube' | 'niconico' | 'unknown' => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('nicovideo.jp')) return 'niconico';
  return 'unknown';
};

/**
 * サムネイルURLを取得する
 */
const getThumbnailUrl = (url: string): string | null => {
  const platform = getPlatform(url);

  if (platform === 'youtube') {
    const videoId = extractYouTubeId(url);
    return videoId
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : null;
  }

  if (platform === 'niconico') {
    // ニコニコ動画のサムネイルはAPIが必要なため、プレースホルダーを返す
    return null;
  }

  return null;
};

/**
 * 動画タイトルを取得（動画データにタイトルがあれば使う、なければプラットフォーム名）
 */
const getVideoTitle = (video: VideoLinkWithSession): string => {
  const platform = getPlatform(video.videoUrl);
  if (platform === 'youtube') return 'YouTube動画';
  if (platform === 'niconico') return 'ニコニコ動画';
  return '動画リンク';
};

/**
 * 動画行（モック準拠: 小サムネ左＋タイトル・投稿者）
 */
const VideoRow = ({
  video,
  isRevealed,
  onReveal,
}: {
  video: VideoLinkWithSession;
  isRevealed: boolean;
  onReveal: () => void;
}) => {
  const thumbnailUrl = getThumbnailUrl(video.videoUrl);

  return (
    <div className={styles.videoRow}>
      <div className={styles.videoRow_thumbnail}>
        {video.spoiler && !isRevealed ? (
          // ネタバレ未解除時はリンクにせず、解除ボタンのみ
          <button
            type="button"
            className={styles.videoRow_spoilerOverlay}
            onClick={onReveal}
          >
            <EyeSlash size={16} />
            <span>ネタバレ表示</span>
          </button>
        ) : (
          <a
            href={video.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.videoRow_thumbnailLink}
          >
            {thumbnailUrl ? (
              <>
                <Image
                  src={thumbnailUrl}
                  alt=""
                  fill
                  sizes="120px"
                  className={styles.video_thumbnailImage}
                />
                <PlayCircle size={24} className={styles.videoRow_playIcon} />
              </>
            ) : (
              <div className={styles.videoRow_placeholder}>
                <PlayCircle size={24} />
              </div>
            )}
            <span className={styles.srOnly}>{getVideoTitle(video)}を開く</span>
          </a>
        )}
      </div>
      <div className={styles.videoRow_info}>
        <a
          href={video.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.videoRow_title}
        >
          {getVideoTitle(video)}
        </a>
        <div className={styles.videoRow_meta}>
          <FilmSlate size={12} />
          <span>
            投稿者:{' '}
            <Link
              href={`/users/${video.user.userId}`}
              className={styles.userLink}
            >
              {video.user.nickname}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export const VideoSection = ({ videos, isPlayed }: VideoSectionProps) => {
  const [revealedVideos, setRevealedVideos] = useState<Set<string>>(new Set());

  // ネタバレ動画があるかどうか
  const hasSpoilerVideos = videos.some((v) => v.spoiler);
  const spoilerVideoIds = videos
    .filter((v) => v.spoiler)
    .map((v) => v.videoLinkId);
  const allSpoilersRevealed = spoilerVideoIds.every((id) =>
    revealedVideos.has(id),
  );

  const handleRevealVideo = (videoId: string) => {
    setRevealedVideos((prev) => new Set([...prev, videoId]));
  };

  const handleToggleSpoiler = () => {
    if (allSpoilersRevealed) {
      // 全て非表示にする
      setRevealedVideos(new Set());
    } else {
      // 全てのネタバレ動画を表示
      setRevealedVideos(new Set(spoilerVideoIds));
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.section_header}>
        <h2 className={styles.section_title}>
          プレイ動画
          <span className={styles.section_count}>（{videos.length}件）</span>
        </h2>
        <div className={styles.section_headerActions}>
          {hasSpoilerVideos && (
            <Switch
              checked={allSpoilersRevealed}
              onCheckedChange={handleToggleSpoiler}
            >
              ネタバレ表示
            </Switch>
          )}
          {isPlayed && videos.length > 0 && (
            <button type="button" className={styles.section_actionButton}>
              <Plus size={14} /> 動画を登録
            </button>
          )}
        </div>
      </div>
      {videos.length === 0 ? (
        <div className={styles.section_empty}>
          {isPlayed ? (
            <>
              <p className={styles.section_emptyText}>
                <FilmSlate size={16} />
                プレイ動画を投稿して、セッションの思い出を共有しましょう！
              </p>
              <button type="button" className={styles.section_ctaButton}>
                動画を登録する
              </button>
            </>
          ) : (
            <p className={styles.section_emptyText}>
              <FilmSlate size={16} /> まだプレイ動画がありません
            </p>
          )}
        </div>
      ) : (
        <div className={styles.videoList}>
          {videos.map((video, index) => (
            <Fragment key={video.videoLinkId}>
              {index > 0 && <hr className={styles.listDivider} />}
              <VideoRow
                video={video}
                isRevealed={revealedVideos.has(video.videoLinkId)}
                onReveal={() => handleRevealVideo(video.videoLinkId)}
              />
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
};
