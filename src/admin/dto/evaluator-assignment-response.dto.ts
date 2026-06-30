export class EvaluatorAssignmentTeacherDto {
  id!: string;
  name!: string;
  email!: string;
  department!: string | null;
}

export class EvaluatorAssignmentEvaluatorDto {
  id!: string;
  name!: string;
  email!: string;
}

export class EvaluatorAssignmentListItemDto {
  teacher!: EvaluatorAssignmentTeacherDto;
  evaluator!: EvaluatorAssignmentEvaluatorDto | null;
  assignedAt!: string | null;
}

export class PaginatedEvaluatorAssignmentsResponseDto {
  items!: EvaluatorAssignmentListItemDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  totalPages!: number;
}
