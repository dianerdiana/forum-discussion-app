import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import type { Leaderboard } from '@/types/leaderboard-type';

type LeaderboardItemProps = {
  leaderboard: Leaderboard;
  order: number;
};

export const LeaderboardItem = ({ leaderboard }: LeaderboardItemProps) => {
  return (
    <Item variant='outline' className='first:bg-primary first:text-white group'>
      <ItemContent>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarImage src={leaderboard.user.avatar} />
            <AvatarFallback>{leaderboard.user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <ItemTitle>{leaderboard.user.name}</ItemTitle>
            <ItemDescription className='group-first:text-white'>{leaderboard.user.email}</ItemDescription>
          </div>
        </div>
      </ItemContent>
      <ItemActions>
        <ItemDescription className='group-first:text-white'>{leaderboard.score}</ItemDescription>
      </ItemActions>
    </Item>
  );
};
