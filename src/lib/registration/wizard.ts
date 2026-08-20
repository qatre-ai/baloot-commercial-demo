export type WizardRole = "student" | "instructor";
export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6;

export function getWizardStepIds(
  role: WizardRole,
  showMinorFields: boolean,
): WizardStepId[] {
  if (role === "instructor" || showMinorFields) {
    return [1, 2, 3, 4, 5, 6];
  }

  return [1, 2, 3, 4, 6];
}

export function getWizardNextStep(
  currentStep: WizardStepId,
  role: WizardRole,
  showMinorFields: boolean,
): WizardStepId | null {
  const stepIds = getWizardStepIds(role, showMinorFields);
  const currentIndex = stepIds.indexOf(currentStep);

  if (currentIndex < 0 || currentIndex === stepIds.length - 1) {
    return null;
  }

  return stepIds[currentIndex + 1] ?? null;
}

export function getWizardPreviousStep(
  currentStep: WizardStepId,
  role: WizardRole,
  showMinorFields: boolean,
): WizardStepId | null {
  const stepIds = getWizardStepIds(role, showMinorFields);
  const currentIndex = stepIds.indexOf(currentStep);

  if (currentIndex <= 0) {
    return null;
  }

  return stepIds[currentIndex - 1] ?? null;
}

export function getWizardStepPosition(
  currentStep: WizardStepId,
  role: WizardRole,
  showMinorFields: boolean,
): number {
  const stepIds = getWizardStepIds(role, showMinorFields);
  const currentIndex = stepIds.indexOf(currentStep);
  return currentIndex < 0 ? 1 : currentIndex + 1;
}

export function isWizardFinalStep(
  currentStep: WizardStepId,
  role: WizardRole,
  showMinorFields: boolean,
): boolean {
  const stepIds = getWizardStepIds(role, showMinorFields);
  return stepIds[stepIds.length - 1] === currentStep;
}

export function getWizardProgress(
  currentStep: WizardStepId,
  role: WizardRole,
  showMinorFields: boolean,
): number {
  const stepIds = getWizardStepIds(role, showMinorFields);
  const position = getWizardStepPosition(currentStep, role, showMinorFields);
  const rawProgress = (position / stepIds.length) * 100;
  return Math.min(100, Math.max(0, Math.round(rawProgress)));
}
