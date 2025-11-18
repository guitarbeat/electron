export type User = 'Aaron' | 'Electra';

export interface Movie {
  id: string;
  title: string;
  addedBy: User;
  watchedBy: User[];
  createdAt: string;
  poster_path?: string;
  release_date?: string;
  overview?: string;
}
