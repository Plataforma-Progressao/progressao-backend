export class AdminDashboardUserCountsDto {
  teachers!: number;
  evaluators!: number;
  admins!: number;
}

export class AdminDashboardUnassignedTeacherDto {
  id!: string;
  name!: string;
  email!: string;
  department!: string | null;
}

export class AdminDashboardEvaluatorLoadDto {
  evaluatorId!: string;
  evaluatorName!: string;
  evaluatorEmail!: string;
  teacherCount!: number;
  pendingCount!: number;
}

export class AdminDashboardRecentAssignmentDto {
  teacherName!: string;
  teacherEmail!: string;
  evaluatorName!: string;
  assignedAt!: string;
}

export class AdminDashboardHomeDto {
  displayName!: string;
  summary!: string;
  userCounts!: AdminDashboardUserCountsDto;
  unassignedTeacherCount!: number;
  unassignedTeachers!: AdminDashboardUnassignedTeacherDto[];
  orphanPendingActivityCount!: number;
  evaluatorLoads!: AdminDashboardEvaluatorLoadDto[];
  recentAssignments!: AdminDashboardRecentAssignmentDto[];
}
