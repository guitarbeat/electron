
export interface Movie {
  id: number;
  title: string;
  created_at: string;
  added_by: User;
  watched: boolean;
  watched_by: User | null;
}

export type User = 'Aaron' | 'Electra';
