import type { TypedStartListening } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '@store/index';
import type { Home } from '@shared/models/rental.model';
import { api } from '@shared/services/rental.service';
import { loadHomes, homesLoaded, homesFailed } from './home.action';
export function homeEffects(listen: TypedStartListening<RootState, AppDispatch>) {
  listen({
    actionCreator: loadHomes,
    effect: async (_, ctx) => {
      ctx.cancelActiveListeners();
      try {
        const homes = await ctx.pause(api<Home[]>('rentals/homes'));
        ctx.dispatch(homesLoaded(homes));
      } catch (e) {
        if (!ctx.signal.aborted)
          ctx.dispatch(homesFailed(e instanceof Error ? e.message : 'Unable to load homes.'));
      }
    },
  });
}
