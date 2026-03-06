// Legacy exports - use services/api/gistService.ts instead
import { matchmakerService } from './api/gistService';
export { matchmakerService };
export const getMatchmakerGame = () => matchmakerService.getMatchmakerGame();
export const saveMatchmakerGame = (game: any) => matchmakerService.saveMatchmakerGame(game);
