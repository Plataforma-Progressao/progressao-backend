export function formatRelativeTimePt(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) {
    return 'Agora';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Agora';
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? 'Há 1 minuto' : `Há ${diffMinutes} minutos`;
  }

  if (diffHours < 24) {
    return diffHours === 1 ? 'Há 1 hora' : `Há ${diffHours} horas`;
  }

  if (diffDays === 1) {
    return 'Ontem';
  }

  if (diffDays < 7) {
    return `${diffDays} dias atrás`;
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'Há 1 semana' : `Há ${weeks} semanas`;
  }

  return date.toLocaleDateString('pt-BR');
}
