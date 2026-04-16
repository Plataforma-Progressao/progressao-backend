export interface DashboardHomePillarDto {
  readonly label: string;
  readonly score: number;
  readonly total: number;
  readonly percentage: number;
  readonly accent: string;
}

export type DashboardNotificationTone = 'warning' | 'success' | 'info';

export interface DashboardHomeNotificationDto {
  readonly title: string;
  readonly description: string;
  readonly timestamp: string;
  readonly icon: string;
  readonly tone: DashboardNotificationTone;
}

export interface DashboardHomeScoreDto {
  readonly current: number;
  readonly target: number;
}

export interface DashboardHomeCareerDto {
  readonly currentLevelLabel: string;
  readonly nextLevelLabel: string;
  readonly progressPercentage: number;
  readonly yearsInLevel: number;
  readonly yearsRequired: number;
  readonly qualisPublications: number;
  readonly qualisTarget: number;
  readonly supervisions: number;
  readonly supervisionsTarget: number;
}

export interface DashboardHomeBienniumDto {
  readonly cycleLabel: string;
  readonly completionPercentage: number;
  readonly departmentComparison: string;
}

export interface DashboardHomeDto {
  readonly displayName: string;
  readonly roleLabel: string;
  readonly summary: string;
  readonly score: DashboardHomeScoreDto;
  readonly career: DashboardHomeCareerDto;
  readonly pillars: readonly DashboardHomePillarDto[];
  readonly biennium: DashboardHomeBienniumDto;
  readonly notifications: readonly DashboardHomeNotificationDto[];
}
