export function notificationText(type: string): string {
  const labels: Record<string, string> = {
    comment: 'comentou na sua publicacao',
    baze: 'deu baze na sua publicacao',
    comment_baze: 'deu baze no seu comentario',
    comment_reply: 'respondeu ao seu comentario',
    follow: 'comecou a seguir voce',
    follow_request: 'pediu para seguir voce',
    follow_accepted: 'aceitou o seu pedido para seguir'
  };

  return labels[type] ?? `nova notificacao: ${type}`;
}
