// @vitest-environment jsdom

import '../../.storybook/vitest.dom.setup';

import { createElement, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { render, renderHook, screen } from '@testing-library/react/pure';
import { describe, expect, it } from 'vitest';

describe.sequential('light DOM setupのテスト間cleanup', () => {
  const source = new window.EventTarget();
  let effectSignal: AbortSignal | undefined;
  let currentProbe = 'mounted';
  let deliveredProbe: string | undefined;

  it('hookの購読と通常DOM・portalを実際にmountする', () => {
    renderHook(() => {
      useEffect(() => {
        const controller = new window.AbortController();
        effectSignal = controller.signal;
        source.addEventListener(
          'probe',
          () => {
            deliveredProbe = currentProbe;
          },
          { signal: controller.signal },
        );
        return () => controller.abort();
      }, []);
    });
    render(
      createElement(
        'main',
        null,
        'DOM cleanup sentinel',
        createPortal(
          createElement(
            'div',
            { role: 'dialog', 'aria-label': 'cleanup portal' },
            'Portal cleanup sentinel',
          ),
          document.body,
        ),
      ),
    );

    source.dispatchEvent(new window.Event('probe'));
    expect(deliveredProbe).toBe('mounted');
    expect(effectSignal?.aborted).toBe(false);
    expect(screen.getByRole('main')).toHaveTextContent('DOM cleanup sentinel');
    expect(
      screen.getByRole('dialog', { name: 'cleanup portal' }),
    ).toBeInTheDocument();
  });

  it('実setupのafterEachが購読を解除し、DOMとportalを次testへ残さない', () => {
    // /pureを使い、テスト自身のRTL自動cleanupでsetupの欠落を隠さない。
    expect(effectSignal?.aborted).toBe(true);
    currentProbe = 'next-test';
    source.dispatchEvent(new window.Event('probe'));
    expect(deliveredProbe).toBe('mounted');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('dialog', { name: 'cleanup portal' }),
    ).not.toBeInTheDocument();
    expect(document.body).toBeEmptyDOMElement();
  });
});
