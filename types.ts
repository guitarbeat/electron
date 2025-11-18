export type User = 'Aaron' | 'Electra';

export interface Movie {
  id: string;
  title: string;
  addedBy: User;
  watchedBy: User[];
  createdAt: string;
}

export interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}
