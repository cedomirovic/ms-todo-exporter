/**
 * Podrazumevana podešavanja za deploy.
 *
 * `clientId` — Azure Application (client) ID. Kada je popunjen, posetioci
 * vide samo dugme „Sign in" i ne moraju ništa da podešavaju. Client ID nije
 * tajna: to je javni identifikator aplikacije, bezbedno stoji u ovom fajlu.
 *
 * `redirectUri` može ostati prazno — tada se koristi trenutna adresa stranice
 * (origin + path). Ako se aplikacija servira sa podputanje, to je ispravno.
 */
window.MS_TODO_EXPORT_CONFIG = {
  clientId: 'f555c0c2-690e-47e2-84c1-9985a1230180',
  redirectUri: '',
};
