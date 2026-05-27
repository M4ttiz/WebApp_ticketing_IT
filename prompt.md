Analizza la pagina del progetto mostrata nello screenshot allegato e modifica la sezione “Asset collegato” nella view del ticket.

OBIETTIVO:
Aggiungere dei filtri avanzati per gli asset collegati mantenendo comunque la barra di ricerca attuale.

REQUISITI:
- Mantieni la barra di ricerca esistente per cercare asset per nome/modello/sede.
- Aggiungi accanto o sopra la barra di ricerca dei filtri con menu a tendina (select/dropdown):
  - Sede
  - Reparto
  - Categoria asset
- I filtri devono essere combinabili tra loro.
- Le select devono caricarsi dinamicamente dai dati già presenti nel database.
- Quando seleziono un filtro:
  - la lista degli asset deve aggiornarsi automaticamente
  - la ricerca testuale deve continuare a funzionare insieme ai filtri
- Aggiungi anche un pulsante “Reset filtri”.
- Mantieni il design dark già presente nel progetto.
- Usa componenti e stile coerenti con l’interfaccia esistente.
- Responsive sia desktop che mobile.

BACKEND:
- Aggiorna eventuali endpoint/API necessari per supportare:
  - filtro per sede
  - filtro per reparto
  - filtro per categoria
  - ricerca testuale combinata
- Ottimizza le query evitando chiamate inutili.
- Se necessario aggiungi indici DB.

FRONTEND:
- Gestisci stato filtri e ricerca in modo pulito.
- Evita reload completi della pagina.
- Mostra eventuale stato “Nessun asset trovato”.

GITHUB:
- Prima di iniziare crea un nuovo branch git chiamato:
  feature/asset-filters-ticket-page

- Lavora esclusivamente su quel branch.
- Alla fine:
  - fai commit con messaggi chiari
  - prepara il codice pronto per una pull request

OUTPUT RICHIESTO:
- Mostrami i file modificati
- Spiega brevemente cosa hai cambiato
- Includi eventuali migration o modifiche database necessarie
- Genera anche un breve testo per la pull request