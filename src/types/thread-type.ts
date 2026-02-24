import type { Comment } from './comment-type';
import type { User } from './user-type';

export type Thread = {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  upVotesBy: string[];
  downVotesBy: string[];
  ownerId?: string;
  owner?: User;
  totalComments?: number;
  comments?: Comment[];
};
