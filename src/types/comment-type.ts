import type { User } from './user-type';

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  ownerId: string;
  upVotesBy: string[];
  downVotesBy: string[];
  owner: User;
};
