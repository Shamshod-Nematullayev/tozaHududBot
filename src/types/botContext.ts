import { Scenes } from "telegraf";

export interface MyWizardSession extends Scenes.WizardSessionData {}

export interface MyContext extends Scenes.WizardContext<MyWizardSession> {
  scene: Scenes.SceneContextScene<MyContext, MyWizardSession>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}
