'use client';

import { useEffect, useState } from 'react';

import * as styles from './styles';

export type TocSection = {
  /** 対応するセクション要素の id（アンカー先） */
  id: string;
  label: string;
};

export type SectionTocProps = {
  /** 表示するセクション（存在するものだけ渡す） */
  sections: TocSection[];
  /** 並び @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /**
   * 現在地を外部制御する場合に指定。未指定なら IntersectionObserver で自動追従。
   */
  activeId?: string;
};

/**
 * SectionToc - 目次（アンカースクロール）
 *
 * **タブではない**: 全セクションは常時ページに存在し、ここはアンカーへスクロール
 * するリンク集（`<nav>` + `<a href="#id">` + `aria-current="location"`）。
 * 未指定時は IntersectionObserver で現在表示中のセクションを自動ハイライト。
 */
export const SectionToc = ({
  sections,
  orientation = 'vertical',
  activeId,
}: SectionTocProps) => {
  const [autoActive, setAutoActive] = useState<string | undefined>(
    sections[0]?.id,
  );
  const active = activeId ?? autoActive;

  useEffect(() => {
    // 制御モード / セクションなし / IO 非対応環境では何もしない
    if (activeId !== undefined) return;
    if (sections.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    // スクロールで通過するだけの中間セクションを拾わないよう、確定を debounce する。
    // これで色・太さ・下線が「止まった時の最終セクション」だけにまとめて切り替わる。
    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // 画面上部に最も近い「表示中」セクションを現在地にする
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const next = visible[0]?.target.id;
        if (!next) return;
        clearTimeout(timer);
        timer = setTimeout(() => setAutoActive(next), 140);
      },
      // 下側を大きく除外して「上端付近のセクション」を選ぶ
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [sections, activeId]);

  if (sections.length === 0) return null;

  const handleClick = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav aria-label="目次" className={styles.nav({ orientation })}>
      {sections.map((section) => {
        const isActive = section.id === active;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={isActive ? 'location' : undefined}
            className={styles.item({ orientation, active: isActive })}
            onClick={(e) => handleClick(e, section.id)}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
};
