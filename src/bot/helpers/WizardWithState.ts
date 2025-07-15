import { Scenes } from "telegraf";

export type WizardWithState<TState> =
  Scenes.WizardContext<Scenes.WizardSessionData> & {
    wizard: Scenes.WizardContextWizard<any> & {
      state: TState;
    };
  };
