import { useEffect } from 'react';

import { Container } from '@/components/container';
import { LeaderboardItem } from '@/features/leaderboard/components/leaderboard-item';
import { getLeaderboards, selectAllLeaderboards } from '@/features/leaderboard/redux/leaderboard-slice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';

const LeaderboardPage = () => {
  const dispatch = useAppDispatch();
  const leaderboardItems = useAppSelector(selectAllLeaderboards);

  useEffect(() => {
    dispatch(getLeaderboards());
  }, [dispatch]);

  return (
    <Container className='pb-24 space-y-4'>
      <div className='bg-foreground flex items-center py-4 px-4'>
        <h1 className='text-2xl font-bold text-white'>Leaderboard</h1>
      </div>
      <div className='px-4 flex flex-col gap-2'>
        {leaderboardItems.map((leaderboard) => (
          <LeaderboardItem key={leaderboard.user.id} leaderboard={leaderboard} />
        ))}
      </div>
    </Container>
  );
};

export default LeaderboardPage;
