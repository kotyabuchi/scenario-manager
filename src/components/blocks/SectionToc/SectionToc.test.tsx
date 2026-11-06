import { composeStories } from '@storybook/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SectionToc } from './SectionToc';
import * as stories from './SectionToc.stories';

const { Controlled } = composeStories(stories);

describe('SectionToc', () => {
  it('nav(目次) とリンクが描画される', () => {
    render(<Controlled />);
    const nav = screen.getByRole('navigation', { name: '目次' });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '概要' })).toHaveAttribute(
      'href',
      '#overview',
    );
  });

  it('activeId のリンクに aria-current=location が付く', () => {
    render(<Controlled />);
    // Controlled の activeId は 'sessions'（関連セッション）
    expect(
      screen.getByRole('link', { name: '関連セッション' }),
    ).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: '概要' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('tablist/tab role は使わない（タブに見せない）', () => {
    render(<Controlled />);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('セクションが空なら何も描画しない', () => {
    render(<SectionToc sections={[]} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
