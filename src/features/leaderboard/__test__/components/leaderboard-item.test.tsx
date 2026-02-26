import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';

import { LeaderboardItem } from '../../components/leaderboard-item.tsx';

// ========== Mock UI components ==========
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid='avatar'>{children}</div>,
  AvatarImage: (props: any) => <img alt='avatar' data-testid='avatar-image' {...props} />,
  AvatarFallback: ({ children }: any) => <span data-testid='avatar-fallback'>{children}</span>,
}));

vi.mock('@/components/ui/item', () => ({
  Item: ({ children, ...rest }: any) => (
    <section data-testid='item' {...rest}>
      {children}
    </section>
  ),
  ItemContent: ({ children }: any) => <div data-testid='item-content'>{children}</div>,
  ItemActions: ({ children }: any) => <div data-testid='item-actions'>{children}</div>,
  ItemTitle: ({ children }: any) => <h3>{children}</h3>,
  ItemDescription: ({ children, ...rest }: any) => <p {...rest}>{children}</p>,
}));

function makeLeaderboard(overrides: Partial<any> = {}) {
  return {
    user: {
      id: 'u-1',
      name: 'Budi',
      email: 'budi@example.com',
      avatar: 'https://example.com/avatar.png',
    },
    score: 42,
    ...overrides,
  };
}

function renderSubject(leaderboardOverrides?: Partial<any>) {
  const leaderboard = makeLeaderboard(leaderboardOverrides);
  render(<LeaderboardItem leaderboard={leaderboard as any} />);
  return { leaderboard };
}

describe('LeaderboardItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user name, email, and score', () => {
    renderSubject();

    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.getByText('budi@example.com')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should render avatar image src and fallback initial', () => {
    renderSubject({
      user: {
        id: 'u-1',
        name: 'Siti',
        email: 'siti@example.com',
        avatar: 'https://example.com/siti.png',
      },
      score: 100,
    });

    const img = screen.getByTestId('avatar-image') as HTMLImageElement;
    expect(img).toHaveAttribute('src', 'https://example.com/siti.png');

    expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('S');
  });

  it('should render score inside actions container', () => {
    renderSubject({ score: 999 });

    const actions = screen.getByTestId('item-actions');
    expect(actions).toHaveTextContent('999');
  });
});
