export function normalizeCareerClass(careerClass: string | null): string {
  const normalized = careerClass?.trim().toLowerCase() ?? '';

  switch (normalized) {
    case 'auxiliar':
      return 'Auxiliar';
    case 'assistente':
      return 'Assistente';
    case 'adjunto':
      return 'Adjunto';
    case 'associado':
      return 'Associado';
    case 'titular':
      return 'Titular';
    default:
      return 'Associado';
  }
}
