import { ParticipantCard } from './ParticipantCard';

import type { Meta, StoryObj } from '@storybook/react';
import type { ParticipantWithUser } from '../../../../interface';
import type { ParticipantCardProps } from './ParticipantCard';

const baseParticipant: ParticipantWithUser = {
  sessionId: '01HSESSION0000000000000001',
  userId: '01HUSER0000000000000000001',
  participantType: 'PLAYER',
  participantStatus: 'CONFIRMED',
  applicationMessage: null,
  appliedAt: '2026-02-01T10:00:00Z',
  approvedAt: '2026-02-01T10:00:00Z',
  characterSheetUrl: null,
  withdrawalReason: null,
  createdAt: '2026-02-01T10:00:00Z',
  updatedAt: '2026-02-01T10:00:00Z',
  user: {
    userId: '01HUSER0000000000000000001',
    userName: 'sample_user',
    nickname: 'サンプル',
    discordId: '123456789',
    image: null,
    bio: null,
    favoriteScenarios: null,
    role: 'MEMBER',
    lastloginAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

type ParticipantOverrides = Partial<Omit<ParticipantWithUser, 'user'>> & {
  user?: Partial<ParticipantWithUser['user']>;
};

const createParticipant = (
  overrides: ParticipantOverrides,
): ParticipantWithUser => {
  const userOverrides = overrides.user ?? {};
  return {
    ...baseParticipant,
    ...overrides,
    user: {
      ...baseParticipant.user,
      ...userOverrides,
    },
  };
};

const meta = {
  title: 'Pages/Sessions/ParticipantCard',
  component: ParticipantCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: 560,
          padding: 16,
          background: '#fff',
          border: '1px solid #eceff3',
          borderRadius: 16,
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    isCurrentUser: false,
    isSessionCreator: false,
    participant: baseParticipant,
  },
} satisfies Meta<typeof ParticipantCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CreatorAsKeeper: Story = {
  name: '主催者（GM/KP）',
  args: {
    isSessionCreator: true,
    participant: createParticipant({
      participantType: 'KEEPER',
      userId: '01HKEEPER00000000000000001',
      user: {
        userId: '01HKEEPER00000000000000001',
        userName: 'gm_taro',
        nickname: 'GM太郎',
      },
    }),
  },
};

export const KeeperNotCreator: Story = {
  name: 'KP（主催者ではない）',
  args: {
    isSessionCreator: false,
    participant: createParticipant({
      participantType: 'KEEPER',
      userId: '01HKEEPER00000000000000002',
      user: {
        userId: '01HKEEPER00000000000000002',
        userName: 'kp_guest',
        nickname: 'KP担当',
      },
    }),
  },
};

export const CreatorAsPlayerWithSubmittedCS: Story = {
  name: '主催者（PL）+ CS提出済',
  args: {
    isSessionCreator: true,
    participant: createParticipant({
      participantType: 'PLAYER',
      characterSheetUrl: 'https://example.com/cs/1',
      userId: '01HPLAYER00000000000000001',
      user: {
        userId: '01HPLAYER00000000000000001',
        userName: 'host_player',
        nickname: '主催PL',
      },
    }),
  },
};

export const CreatorAsPlayerWithoutCS: Story = {
  name: '主催者（PL）+ 未提出',
  args: {
    isSessionCreator: true,
    participant: createParticipant({
      participantType: 'PLAYER',
      characterSheetUrl: null,
      userId: '01HPLAYER00000000000000002',
      user: {
        userId: '01HPLAYER00000000000000002',
        userName: 'host_player_no_cs',
        nickname: '主催PL2',
      },
    }),
  },
};

export const PlayerSubmittedCS: Story = {
  name: 'PL（CS提出済）',
  args: {
    participant: createParticipant({
      participantType: 'PLAYER',
      characterSheetUrl: 'https://example.com/cs/2',
      userId: '01HPLAYER00000000000000003',
      user: {
        userId: '01HPLAYER00000000000000003',
        userName: 'player_a',
        nickname: 'プレイヤーA',
      },
    }),
  },
};

export const PlayerMissingCS: Story = {
  name: 'PL（未提出）',
  args: {
    participant: createParticipant({
      participantType: 'PLAYER',
      characterSheetUrl: null,
      userId: '01HPLAYER00000000000000004',
      user: {
        userId: '01HPLAYER00000000000000004',
        userName: 'player_b',
        nickname: 'プレイヤーB',
      },
    }),
  },
};

export const Spectator: Story = {
  name: '観戦者（ステータスなし）',
  args: {
    participant: createParticipant({
      participantType: 'SPECTATOR',
      characterSheetUrl: null,
      userId: '01HSPECTATOR0000000000001',
      user: {
        userId: '01HSPECTATOR0000000000001',
        userName: 'spectator_1',
        nickname: '見学者',
      },
    }),
  },
};

export const StatusMatrix: Story = {
  name: '表示整理ケース一覧',
  render: () => {
    const cases = [
      {
        label: '主催者（GM/KP）',
        args: CreatorAsKeeper.args,
      },
      {
        label: 'KP（主催者ではない）',
        args: KeeperNotCreator.args,
      },
      {
        label: '主催者（PL）+ CS提出済',
        args: CreatorAsPlayerWithSubmittedCS.args,
      },
      {
        label: '主催者（PL）+ 未提出',
        args: CreatorAsPlayerWithoutCS.args,
      },
      {
        label: 'PL（CS提出済）',
        args: PlayerSubmittedCS.args,
      },
      {
        label: 'PL（未提出）',
        args: PlayerMissingCS.args,
      },
      {
        label: '観戦者',
        args: Spectator.args,
      },
    ];

    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {cases.map((item) => (
          <div key={item.label}>
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 600,
              }}
            >
              {item.label}
            </p>
            <ParticipantCard {...(item.args as ParticipantCardProps)} />
          </div>
        ))}
      </div>
    );
  },
};
