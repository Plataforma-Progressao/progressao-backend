export class EvaluatorDashboardSummaryDto {
  assignedTeacherCount!: number;
  pendingCount!: number;
  pendingChecklistCount!: number;
  approvedLast30Days!: number;
  rejectedLast30Days!: number;
}

export class EvaluatorDashboardTeacherDto {
  id!: string;
  name!: string;
  email!: string;
  department!: string | null;
  pendingCount!: number;
}

export class EvaluatorDashboardPendingActivityDto {
  id!: string;
  title!: string;
  teacherName!: string;
  category!: string;
  submittedAt!: string | null;
}

export class EvaluatorDashboardCategoryBreakdownDto {
  category!: string;
  label!: string;
  pendingCount!: number;
}

export class EvaluatorDashboardHomeDto {
  displayName!: string;
  summary!: string;
  summaryStats!: EvaluatorDashboardSummaryDto;
  teachers!: EvaluatorDashboardTeacherDto[];
  pendingActivities!: EvaluatorDashboardPendingActivityDto[];
  categoryBreakdown!: EvaluatorDashboardCategoryBreakdownDto[];
}
