/**
 * Podrazumevana podešavanja za deploy.
 *
 * Ovde upiši client ID svoje Azure aplikacije da bi posetioci mogli da se
 * prijave jednim klikom. Ako je prazno, aplikacija će tražiti client ID u UI-ju
 * i sačuvati ga u localStorage (korisno za lokalni razvoj).
 *
 * redirectUri može ostati prazno — tada se koristi trenutna adresa stranice
 * (origin + path). Ako se aplikacija servira sa podputanje, to je ispravno.
 */
window.MS_TODO_EXPORT_CONFIG = {
  clientId: '',
  redirectUri: '',
};
