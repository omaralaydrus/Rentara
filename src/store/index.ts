import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { homeReducer } from '@modules/homes/store/home.reducer';
import { homeEffects } from '@modules/homes/store/home.effect';
export function makeStore() {
  const listener = createListenerMiddleware();
  const store = configureStore({
    reducer: { homes: homeReducer },
    middleware: (g) => g().prepend(listener.middleware),
  });
  homeEffects(listener.startListening.withTypes<RootState, AppDispatch>());
  return store;
}
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
