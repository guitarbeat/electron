// Generic mutation pattern used across useMovies and useMatchmaker
export interface MutationConfig<T> {
  fetchFn: () => Promise<T>;
  saveFn: (data: T) => Promise<void>;
  refreshFn: () => void;
}

export class MutationHelper<T> {
  private isSubmitting = false;
  private mutationLock: Promise<void> | null = null;

  constructor(private config: MutationConfig<T>) {}

  async performMutation(currentUser: string | null, mutationFn: (latestData: T) => T): Promise<void> {
    if (!currentUser) return;

    const mutation = (async () => {
      try {
        await this.mutationLock;
      } catch (e) {
        // Ignore previous errors
      }

      this.isSubmitting = true;
      try {
        const latestData = await this.config.fetchFn();
        const updatedData = mutationFn(latestData);
        await this.config.saveFn(updatedData);
        this.config.refreshFn();
      } catch (err) {
        console.error('Mutation failed:', err);
        throw err;
      } finally {
        this.isSubmitting = false;
      }
    })();

    this.mutationLock = mutation;
    await mutation;
  }

  getIsSubmitting(): boolean {
    return this.isSubmitting;
  }
}
