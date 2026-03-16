// AHA 2017 Blood Pressure Classification

export const BP_STATUS = {
  NORMAL: 'normal',
  ELEVATED: 'elevated',
  HIGH_STAGE_1: 'high1',
  HIGH_STAGE_2: 'high2',
  CRISIS: 'crisis',
}

/**
 * Classify blood pressure per AHA 2017 guidelines
 * @param {number} systolic
 * @param {number} diastolic
 * @returns {{ status: string, colorClass: string, bgClass: string, isCrisis: boolean }}
 */
export function classifyBP(systolic, diastolic) {
  if (systolic > 180 || diastolic > 120) {
    return {
      status: BP_STATUS.CRISIS,
      colorClass: 'text-red-900',
      bgClass: 'bg-red-100 border-red-500',
      badgeClass: 'bg-red-800 text-white',
      isCrisis: true,
    }
  }
  if (systolic >= 140 || diastolic >= 90) {
    return {
      status: BP_STATUS.HIGH_STAGE_2,
      colorClass: 'text-red-700',
      bgClass: 'bg-red-50 border-red-300',
      badgeClass: 'bg-red-600 text-white',
      isCrisis: false,
    }
  }
  if (systolic >= 130 || diastolic >= 80) {
    return {
      status: BP_STATUS.HIGH_STAGE_1,
      colorClass: 'text-orange-700',
      bgClass: 'bg-orange-50 border-orange-300',
      badgeClass: 'bg-orange-500 text-white',
      isCrisis: false,
    }
  }
  if (systolic >= 120 && diastolic < 80) {
    return {
      status: BP_STATUS.ELEVATED,
      colorClass: 'text-yellow-700',
      bgClass: 'bg-yellow-50 border-yellow-300',
      badgeClass: 'bg-yellow-500 text-white',
      isCrisis: false,
    }
  }
  return {
    status: BP_STATUS.NORMAL,
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50 border-green-300',
    badgeClass: 'bg-green-600 text-white',
    isCrisis: false,
  }
}
