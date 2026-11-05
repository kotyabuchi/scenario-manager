import { createSourceFixture } from './createSource';

const DIRECTORY = 'src/app/sessions/[id]/schedule';
const WORKSPACE = `${DIRECTORY}/availability/ConfirmAvailabilityWorkspace.tsx`;
const STORY = `${DIRECTORY}/availability/AvailabilityWorkspaces.stories.tsx`;
export const CONFIRM_PAGE = `${DIRECTORY}/confirm/page.tsx`;
export const SUBMIT_PAGE = `${DIRECTORY}/availability/page.tsx`;
export const CONFIRM_ACTIONS = `${DIRECTORY}/confirm/actions.ts`;
export const CONFIRM_ADAPTER = `${DIRECTORY}/confirm/adapter.ts`;
export const INLINE_CONFIRM = `action:${CONFIRM_PAGE}#ScheduleConfirmPage/confirmTimeBlocksServerAction`;
export const EXPORT_CONFIRM = `action:${CONFIRM_ACTIONS}#confirmScheduleTimeBlocksAction`;
export const SUBMIT_ACTION = `action:${DIRECTORY}/availability/actions.ts#submitAvailabilityAction`;

const source = {
  'node_modules/react/index.d.ts': `
export type ReactNode = unknown;
export declare function useTransition(): [boolean, (callback: () => void) => void];
export declare function useOptimistic<T>(value: T): [T, (value: T) => void];
export declare function useState<T>(value: T): [T, (value: T) => void];
export declare function forwardRef<T, P>(render: (props: P, ref: unknown) => unknown): (props: P) => unknown;`,
  'node_modules/react-dom/index.d.ts': `
export declare function createPortal(children: unknown, target: unknown): unknown;`,
  'node_modules/@ark-ui/react/factory/index.d.ts': `
export declare const ark: { button: (props: Record<string, unknown>) => unknown };`,
  'styled-system/jsx/index.d.ts': `
export declare function styled<T>(base: T, recipe: object): T;`,
  'node_modules/@supabase/supabase-js/index.d.ts': `
export declare class SupabaseClient {
  rpc(name: string, parameters: object): Promise<unknown>;
}
export declare function createClient(url: string, key: string): SupabaseClient;`,
  'src/components/elements/button/button.tsx': `
import { forwardRef } from 'react';
import { ark } from '@ark-ui/react/factory';
import { styled } from 'styled-system/jsx';
const recipe = {};
export const StyledButton = styled(ark.button, recipe);
export const Button = forwardRef<unknown, { children?: unknown; onClick?: () => void }>(
  (props, ref) => {
    const { children, ...rest } = props;
    return <StyledButton {...rest} ref={ref}>{children}</StyledButton>;
  },
);`,
  [`${DIRECTORY}/availability/AvailabilityWorkspaceLayout.tsx`]: `
import type { ReactNode } from 'react';
export function AvailabilityWorkspaceLayout({ selectedTimeBlocksSection, stickyBar }: {
  selectedTimeBlocksSection: ReactNode; stickyBar: ReactNode;
}) {
  return <div><main>{selectedTimeBlocksSection}</main>{stickyBar}</div>;
}`,
  [`${DIRECTORY}/availability/SelectedTimeBlocksStickyBar.tsx`]: `
import { createPortal } from 'react-dom';
import { Button } from '@/components/elements/button/button';
export function SelectedTimeBlocksStickyBar({ onPrimaryAction }: { onPrimaryAction: () => void }) {
  return createPortal(<div><Button onClick={onPrimaryAction}>固定バー</Button></div>, document.body);
}`,
  [WORKSPACE]: `
import { useOptimistic, useState, useTransition } from 'react';
import { Button } from '@/components/elements/button/button';
import { AvailabilityWorkspaceLayout } from './AvailabilityWorkspaceLayout';
import { SelectedTimeBlocksStickyBar } from './SelectedTimeBlocksStickyBar';
export function ConfirmAvailabilityWorkspace({ onConfirmTimeBlocks }: {
  onConfirmTimeBlocks?: (timeBlocks: string[]) => Promise<unknown>;
}) {
  const [, setMessage] = useState('');
  const [, setOptimisticTimeBlocks] = useOptimistic<string[]>([]);
  const [, startTransition] = useTransition();
  const selectedTimeBlocks = ['12:00'];
  const handleConfirm = () => {
    if (!onConfirmTimeBlocks) {
      setMessage('Storybookモード');
      return;
    }
    setOptimisticTimeBlocks(selectedTimeBlocks);
    startTransition(async () => {
      const result = await onConfirmTimeBlocks(selectedTimeBlocks);
      if (!result) { setMessage('失敗'); return; }
      setMessage('保存済み');
    });
  };
  return <AvailabilityWorkspaceLayout
    selectedTimeBlocksSection={<div><Button onClick={handleConfirm}>通常位置</Button></div>}
    stickyBar={<SelectedTimeBlocksStickyBar onPrimaryAction={handleConfirm} />}
  />;
}`,
  [CONFIRM_PAGE]: `
import { ConfirmAvailabilityWorkspace } from '../availability/ConfirmAvailabilityWorkspace';
import { confirmScheduleTimeBlocksAction } from './actions';
export default async function ScheduleConfirmPage({ id }: { id: string }) {
  async function confirmTimeBlocksServerAction(timeBlocks: string[]) {
    'use server';
    return confirmScheduleTimeBlocksAction(id, { timeBlocks });
  }
  return <ConfirmAvailabilityWorkspace onConfirmTimeBlocks={confirmTimeBlocksServerAction} />;
}`,
  [CONFIRM_ACTIONS]: `'use server';
import { replaceConfirmedScheduleTimeBlocks } from './adapter';
export async function confirmScheduleTimeBlocksAction(id: string, input: { timeBlocks: string[] }) {
  return replaceConfirmedScheduleTimeBlocks(id, input);
}`,
  [CONFIRM_ADAPTER]: `
import { createClient } from '@supabase/supabase-js';
export async function replaceConfirmedScheduleTimeBlocks(id: string, input: { timeBlocks: string[] }) {
  const supabase = createClient('fixture', 'fixture');
  return supabase.rpc('replace_confirmed_schedule_time_blocks', { id, ...input });
}`,
  [SUBMIT_PAGE]: `
import { SelectedTimeBlocksStickyBar } from './SelectedTimeBlocksStickyBar';
import { submitAvailabilityAction } from './actions';
export default function SubmitAvailabilityPage() {
  return <SelectedTimeBlocksStickyBar onPrimaryAction={submitAvailabilityAction} />;
}`,
  [`${DIRECTORY}/availability/actions.ts`]: `'use server';
export async function submitAvailabilityAction() { return true; }`,
  [STORY]: `
import { ConfirmAvailabilityWorkspace } from './ConfirmAvailabilityWorkspace';
const meta = { title: 'Availability workspaces', component: ConfirmAvailabilityWorkspace };
export default meta;
export const Omitted = { render: () => <ConfirmAvailabilityWorkspace /> };
export const Mock = { render: () => {
  const mock = async () => false;
  return <ConfirmAvailabilityWorkspace onConfirmTimeBlocks={mock} />;
} };`,
};

/** 同じfixture bytesを別のTypeScript ProgramでproductとCSFの入口から観測する。 */
export const createSurfaceConfirmFixture = () => {
  const context = createSourceFixture(source);
  const storyContext = createSourceFixture(source);
  const sourceFile = storyContext.program.getSourceFile(
    `${storyContext.root}/${STORY}`,
  );
  if (!sourceFile) throw new Error('Storybook fixtureがありません。');
  return {
    context,
    storyContext: {
      ...storyContext,
      files: [...storyContext.files, { path: STORY, sourceFile }],
    },
  };
};
