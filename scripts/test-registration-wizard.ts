import {
  getWizardNextStep,
  getWizardPreviousStep,
  getWizardProgress,
  isWizardFinalStep,
  getWizardStepIds,
} from "../src/lib/registration/wizard";
import { resolveInstrumentProfile } from "../src/lib/validation/instruments";

function assertEqual<T>(label: string, actual: T, expected: T) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

function assertDeepEqual(label: string, actual: unknown, expected: unknown) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${label}: expected ${expectedJson}, received ${actualJson}`,
    );
  }
}

const studentSteps = getWizardStepIds("student", false);
assertDeepEqual("adult student visible steps", studentSteps, [1, 2, 3, 4, 6]);
assertEqual("adult student step 4 next", getWizardNextStep(4, "student", false), 6);
assertEqual("adult student step 6 progress", getWizardProgress(6, "student", false), 100);
assertEqual("adult student step 6 is final", isWizardFinalStep(6, "student", false), true);
assertEqual("adult student step 6 previous", getWizardPreviousStep(6, "student", false), 4);

assertEqual("minor student step 5 next", getWizardNextStep(5, "student", true), 6);
assertEqual("instructor step 5 next", getWizardNextStep(5, "instructor", false), 6);
assertEqual("instructor step 5 progress", getWizardProgress(5, "instructor", false), 83);
assertEqual("progress never exceeds 100", getWizardProgress(6, "student", false) <= 100, true);

assertDeepEqual(
  "instrument fallback and duplicate removal",
  resolveInstrumentProfile({
    registrationInstrument: "guitar",
    primaryInstrument: "",
    secondaryInstruments: ["guitar", "piano", "piano", "none"],
  }),
  {
    registrationInstrument: "guitar",
    primaryInstrument: "guitar",
    secondaryInstruments: JSON.stringify(["piano"]),
  },
);

assertDeepEqual(
  "legacy secondary instrument payload",
  resolveInstrumentProfile({
    registrationInstrument: "violin",
    primaryInstrument: "piano",
    secondaryInstruments: '["violin","guitar","guitar"]',
  }),
  {
    registrationInstrument: "violin",
    primaryInstrument: "piano",
    secondaryInstruments: JSON.stringify(["guitar"]),
  },
);

console.log("PASS — registration wizard unit checks");
