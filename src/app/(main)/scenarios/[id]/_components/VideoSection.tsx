'use client';

import { useState } from 'react';
import { EyeOff, PlayCircle, Plus, Video } from 'lucide-react';
import Image from 'next/image';

import * as styles from './styles';

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
 * 動画カード
 */
const VideoCard = ({
  video,
  isRevealed,
  onReveal,
}: {
  video: VideoLinkWithSession;
  isRevealed: boolean;
  onReveal: () => void;
}) => {
  const thumbnailUrl = getThumbnailUrl(video.videoUrl);

  // spoiler=false または 表示済みの場合はサムネイルを表示
  const shouldShowThumbnail = !video.spoiler || isRevealed;

  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.videoCard}
    >
      <div className={styles.videoCard_thumbnail}>
        {shouldShowThumbnail && thumbnailUrl ? (
          <>
            <Image
              src={thumbnailUrl}
              alt="動画サムネイル"
              fill
              sizes="280px"
              className={styles.video_thumbnailImage}
            />
            <PlayCircle size={48} className={styles.videoCard_playIcon} />
          </>
        ) : video.spoiler && !isRevealed ? (
          <button
            type="button"
            className={styles.videoCard_spoilerOverlay}
            onClick={(e) => {
              e.preventDefault();
              onReveal();
            }}
          >
            <EyeOff size={24} />
            <span>ネタバレを含む可能性があります</span>
            <span className={styles.video_spoilerHint}>クリックで表示</span>
          </button>
        ) : (
          <div className={styles.videoCard_placeholder}>
            <PlayCircle size={48} />
          </div>
        )}
      </div>
      <div className={styles.videoCard_info}>
        <div className={styles.videoCard_title}>{getVideoTitle(video)}</div>
        <div className={styles.videoCard_meta}>
          <Video size={12} />
          <span>投稿者: {video.user.nickname}</span>
        </div>
      </div>
    </a>
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
        <h2 className={styles.section_title}>プレイ動画</h2>
        <div className={styles.section_headerActions}>
          {hasSpoilerVideos && (
            <label className={styles.spoilerToggle}>
              <input
                type="checkbox"
                checked={allSpoilersRevealed}
                onChange={handleToggleSpoiler}
              />
              <span>ネタバレ表示</span>
            </label>
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
                <Video size={16} />
                プレイ動画を投稿して、セッションの思い出を共有しましょう！
              </p>
              <button type="button" className={styles.section_ctaButton}>
                動画を登録する
              </button>
            </>
          ) : (
            <p className={styles.section_emptyText}>
              <Video size={16} /> まだプレイ動画がありません
            </p>
          )}
        </div>
      ) : (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <VideoCard
              key={video.videoLinkId}
              video={video}
              isRevealed={revealedVideos.has(video.videoLinkId)}
              onReveal={() => handleRevealVideo(video.videoLinkId)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
