/**
 * Envoi des e-mails transactionnels.
 * - console : écrit le lien dans le terminal du serveur (développement) ;
 * - memory : conserve les messages (tests).
 * Un vrai prestataire d'envoi sera branché avec Supabase ou séparément.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  link?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export function createConsoleMailer(): Mailer {
  return {
    async send(m) {
      console.info(`[e-mail] À : ${m.to} · ${m.subject}${m.link ? `\n[e-mail] Lien : ${m.link}` : ""}`);
    },
  };
}

export function createMemoryMailer(): Mailer & { outbox: MailMessage[] } {
  const outbox: MailMessage[] = [];
  return {
    outbox,
    async send(m) {
      outbox.push(m);
    },
  };
}
