import type { Comment } from './comment-type';
import type { User } from './user-type';

export type Thread = {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  ownerId: string;
  upVotesBy: string[];
  downVotesBy: string[];
  totalComments?: number;
  owner?: User;
  comments?: Comment[];
};
