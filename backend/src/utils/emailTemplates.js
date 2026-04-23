// ============================================
// HTML Email Templates — IT Ticketing
// ============================================

/**
 * Base HTML wrapper for all emails.
 * Dark/blue IT professional theme.
 */
function baseTemplate(title, bodyContent) {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🎫 IT Ticketing
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                Sistema di Supporto IT
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                Questa è un'email automatica dal sistema IT Ticketing.<br>
                Non rispondere a questa email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Styled link button */
function linkButton(url, text) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:8px;padding:12px 32px;">
          <a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

/** Info row */
function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;color:#94a3b8;font-size:13px;font-weight:600;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#e2e8f0;font-size:13px;">${value}</td>
    </tr>`;
}

// ─── Template Functions ────────────────────

function ticketCreated(ticket, appUrl) {
  const statusColors = {
    open: '#22c55e', in_progress: '#3b82f6', on_hold: '#f59e0b',
    resolved: '#8b5cf6', closed: '#64748b',
  };
  const priorityLabels = { low: 'Bassa', medium: 'Media', high: 'Alta', urgent: 'Urgente' };
  const statusLabels = { open: 'Aperto', in_progress: 'In lavorazione', on_hold: 'In attesa', resolved: 'Risolto', closed: 'Chiuso' };

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Nuovo Ticket Aperto</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">Un nuovo ticket è stato creato e richiede attenzione.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:8px;padding:20px;margin-bottom:16px;">
      ${infoRow('Ticket', `<strong style="color:#3b82f6;">${ticket.ticketNumber}</strong>`)}
      ${infoRow('Titolo', ticket.title)}
      ${infoRow('Categoria', ticket.category)}
      ${infoRow('Priorità', `<span style="color:${ticket.priority === 'urgent' ? '#ef4444' : '#f59e0b'};">${priorityLabels[ticket.priority] || ticket.priority}</span>`)}
      ${infoRow('Stato', `<span style="color:${statusColors[ticket.status] || '#22c55e'};">● ${statusLabels[ticket.status] || ticket.status}</span>`)}
      ${infoRow('Richiedente', ticket.requesterName)}
      ${infoRow('Data', new Date(ticket.createdAt).toLocaleString('it-IT'))}
    </table>
    ${linkButton(`${appUrl}/tickets/${ticket.id}`, 'Visualizza Ticket')}`;

  return baseTemplate('Nuovo Ticket — IT Ticketing', body);
}

function ticketAssigned(ticket, technicianName, appUrl) {
  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Ticket Assegnato</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
      Il ticket <strong style="color:#3b82f6;">${ticket.ticketNumber}</strong> è stato assegnato a <strong style="color:#e2e8f0;">${technicianName}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:8px;padding:20px;margin-bottom:16px;">
      ${infoRow('Ticket', `<strong style="color:#3b82f6;">${ticket.ticketNumber}</strong>`)}
      ${infoRow('Titolo', ticket.title)}
      ${infoRow('Tecnico', technicianName)}
    </table>
    ${linkButton(`${appUrl}/tickets/${ticket.id}`, 'Visualizza Ticket')}`;

  return baseTemplate('Ticket Assegnato — IT Ticketing', body);
}

function ticketStatusChanged(ticket, oldStatus, newStatus, appUrl) {
  const statusLabels = { open: 'Aperto', in_progress: 'In lavorazione', on_hold: 'In attesa', resolved: 'Risolto', closed: 'Chiuso' };

  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Stato Ticket Aggiornato</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
      Lo stato del ticket <strong style="color:#3b82f6;">${ticket.ticketNumber}</strong> è cambiato.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:8px;padding:20px;margin-bottom:16px;">
      ${infoRow('Ticket', `<strong style="color:#3b82f6;">${ticket.ticketNumber}</strong>`)}
      ${infoRow('Titolo', ticket.title)}
      ${infoRow('Stato precedente', `<span style="color:#f59e0b;">${statusLabels[oldStatus] || oldStatus}</span>`)}
      ${infoRow('Nuovo stato', `<span style="color:#22c55e;">${statusLabels[newStatus] || newStatus}</span>`)}
    </table>
    ${linkButton(`${appUrl}/tickets/${ticket.id}`, 'Visualizza Ticket')}`;

  return baseTemplate('Stato Ticket Aggiornato — IT Ticketing', body);
}

function newMessage(ticket, senderName, messagePreview, appUrl) {
  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Nuovo Messaggio</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
      <strong style="color:#e2e8f0;">${senderName}</strong> ha inviato un messaggio sul ticket
      <strong style="color:#3b82f6;">${ticket.ticketNumber}</strong>.
    </p>
    <div style="background-color:#0f172a;border-radius:8px;padding:20px;margin-bottom:16px;border-left:3px solid #3b82f6;">
      <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.6;font-style:italic;">
        "${messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}"
      </p>
    </div>
    ${linkButton(`${appUrl}/tickets/${ticket.id}`, 'Rispondi')}`;

  return baseTemplate('Nuovo Messaggio — IT Ticketing', body);
}

function passwordReset(userName, resetUrl) {
  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Reset Password</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
      Ciao <strong style="color:#e2e8f0;">${userName}</strong>,<br>
      è stato richiesto il reset della tua password. Clicca il pulsante qui sotto per impostare una nuova password.
    </p>
    ${linkButton(resetUrl, 'Reimposta Password')}
    <p style="margin:16px 0 0;color:#64748b;font-size:12px;">
      Il link scade tra 1 ora. Se non hai richiesto il reset, ignora questa email.
    </p>`;

  return baseTemplate('Reset Password — IT Ticketing', body);
}

function accountCreated(user, tempPassword, appUrl) {
  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Benvenuto!</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
      Ciao <strong style="color:#e2e8f0;">${user.firstName}</strong>,<br>
      un account è stato creato per te nel sistema IT Ticketing.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:8px;padding:20px;margin-bottom:16px;">
      ${infoRow('Email', user.email)}
      ${infoRow('Password temporanea', `<code style="background:#334155;padding:2px 8px;border-radius:4px;color:#f59e0b;">${tempPassword}</code>`)}
      ${infoRow('Ruolo', user.role === 'admin' ? 'Amministratore' : user.role === 'technician' ? 'Tecnico IT' : 'Utente')}
    </table>
    <p style="margin:0 0 16px;color:#f59e0b;font-size:13px;">⚠️ Ti verrà chiesto di cambiare la password al primo accesso.</p>
    ${linkButton(appUrl, 'Accedi al Portale')}`;

  return baseTemplate('Nuovo Account — IT Ticketing', body);
}

function adminPasswordReset(userName, tempPassword, appUrl) {
  const body = `
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:20px;">Password Reimpostata</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">
      Ciao <strong style="color:#e2e8f0;">${userName}</strong>,<br>
      la tua password è stata reimpostata da un amministratore.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:8px;padding:20px;margin-bottom:16px;">
      ${infoRow('Nuova password', `<code style="background:#334155;padding:2px 8px;border-radius:4px;color:#f59e0b;">${tempPassword}</code>`)}
    </table>
    <p style="margin:0 0 16px;color:#f59e0b;font-size:13px;">⚠️ Ti verrà chiesto di cambiare la password al prossimo accesso.</p>
    ${linkButton(appUrl, 'Accedi al Portale')}`;

  return baseTemplate('Password Reimpostata — IT Ticketing', body);
}

module.exports = {
  ticketCreated,
  ticketAssigned,
  ticketStatusChanged,
  newMessage,
  passwordReset,
  accountCreated,
  adminPasswordReset,
};
