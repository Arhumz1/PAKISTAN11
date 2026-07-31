export interface CreditScoreInput {
  isNewAccount?: boolean;
  declaredIncome?: number;
  propertiesCount?: number;
  vehiclesCount?: number;
}

export interface CreditScoreResult {
  score: number;
  ratingText: string;
  creditGrade: string;
  creditText: string;
  ratingColor: string;
  badgeBg: string;
}

export function calculateCreditScore({
  isNewAccount,
  declaredIncome = 0,
  propertiesCount = 0,
  vehiclesCount = 0,
}: CreditScoreInput): CreditScoreResult {
  let computedScore = 680; // Base score for Pakistan citizen eCIB

  if (declaredIncome > 0) {
    computedScore += Math.min(100, Math.round((declaredIncome / 2000000) * 50) + 30);
  }
  if (propertiesCount > 0) {
    computedScore += Math.min(40, propertiesCount * 20);
  }
  if (vehiclesCount > 0) {
    computedScore += Math.min(30, vehiclesCount * 15);
  }

  // Default clean record boost for existing verified profiles
  if (!isNewAccount && declaredIncome === 0 && propertiesCount === 0 && vehiclesCount === 0) {
    computedScore = 750;
  }

  const score = Math.min(850, Math.max(300, computedScore));

  let ratingText = "Good / Clean Record";
  let creditGrade = "Grade A";
  let creditText = "Good / Clean Record";
  let ratingColor = "text-emerald-600 dark:text-emerald-400";
  let badgeBg = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";

  if (score >= 750) {
    ratingText = "Excellent (Class A)";
    creditGrade = "Grade A+";
    creditText = "Excellent (Class A)";
    ratingColor = "text-emerald-600 dark:text-emerald-400";
    badgeBg = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
  } else if (score >= 650) {
    ratingText = "Good / Clean Record";
    creditGrade = "Grade A";
    creditText = "Good / Clean Record";
    ratingColor = "text-emerald-600 dark:text-emerald-400";
    badgeBg = "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800";
  } else {
    ratingText = "Fair / Building Record";
    creditGrade = "Grade B";
    creditText = "Fair / Building Record";
    ratingColor = "text-amber-600 dark:text-amber-400";
    badgeBg = "bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800";
  }

  return {
    score,
    ratingText,
    creditGrade,
    creditText,
    ratingColor,
    badgeBg,
  };
}
