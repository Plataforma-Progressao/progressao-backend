export interface ActivityAuditSnapshot {
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly workloadHours: number;
  readonly score: number;
  readonly term: string | null;
  readonly kind: string | null;
}

export interface ActivityFieldChange {
  readonly field: string;
  readonly fieldLabel: string;
  readonly oldValue: string | null;
  readonly newValue: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  title: 'título',
  description: 'descrição',
  category: 'categoria',
  workloadHours: 'carga horária',
  score: 'pontuação',
  term: 'período',
  kind: 'tipo',
};

const CATEGORY_LABELS: Record<string, string> = {
  TEACHING: 'Ensino',
  RESEARCH: 'Pesquisa',
  OUTREACH: 'Extensão',
  MANAGEMENT: 'Gestão',
};

function formatHours(value: number): string {
  const totalMinutes = Math.round(value * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatNumber(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

function formatFieldValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (field) {
    case 'category':
      return CATEGORY_LABELS[String(value)] ?? String(value);
    case 'workloadHours':
      return formatHours(Number(value));
    case 'score':
      return `${formatNumber(Number(value))} pts`;
    default:
      return String(value);
  }
}

export function snapshotFromActivity(activity: {
  title: string;
  description: string;
  category: string;
  workloadHours: { toString(): string } | number | string;
  score: { toString(): string } | number | string;
  term: string | null;
  kind: string | null;
}): ActivityAuditSnapshot {
  return {
    title: activity.title,
    description: activity.description,
    category: activity.category,
    workloadHours: Number(activity.workloadHours),
    score: Number(activity.score),
    term: activity.term,
    kind: activity.kind,
  };
}

export function diffActivityFields(
  before: ActivityAuditSnapshot,
  after: ActivityAuditSnapshot,
): ActivityFieldChange[] {
  const fields: (keyof ActivityAuditSnapshot)[] = [
    'title',
    'description',
    'category',
    'workloadHours',
    'score',
    'term',
    'kind',
  ];

  const changes: ActivityFieldChange[] = [];

  for (const field of fields) {
    const oldRaw = before[field];
    const newRaw = after[field];

    const oldComparable =
      field === 'workloadHours' || field === 'score'
        ? Number(oldRaw).toFixed(2)
        : String(oldRaw ?? '');
    const newComparable =
      field === 'workloadHours' || field === 'score'
        ? Number(newRaw).toFixed(2)
        : String(newRaw ?? '');

    if (oldComparable === newComparable) {
      continue;
    }

    changes.push({
      field,
      fieldLabel: FIELD_LABELS[field] ?? field,
      oldValue: formatFieldValue(field, oldRaw),
      newValue: formatFieldValue(field, newRaw),
    });
  }

  return changes;
}

export const ACTIVITY_CREATED_FIELD = '__created__';

export function creationChangeEntry(): ActivityFieldChange {
  return {
    field: ACTIVITY_CREATED_FIELD,
    fieldLabel: 'registro',
    oldValue: null,
    newValue: 'Atividade criada',
  };
}
