# Microsoft To Do → Export

Statična web aplikacija koja izvozi tvoje **Microsoft To Do** liste u šest formata.

**Live:** https://cedomirovic.github.io/ms-todo-exporter/

Radi u browseru, bez backend-a: prijaviš se svojim Microsoft nalogom, izabereš format i preuzmeš fajl.

- ✅ Lični nalozi (`outlook.com`, `hotmail.com`, `live.com`)
- ✅ Poslovni i školski Microsoft 365 nalozi
- ✅ Demo režim za testiranje bez prijave
- ✅ Samo čitanje (`Tasks.Read`) — aplikacija ne može da menja ni briše zadatke
- ✅ Bez kolačića za praćenje, bez analitike, bez servera

## Dizajn i podešavanje

Aplikacija je dizajnirana prema vizuelnom identitetu [Growit](https://growitagile.com/) — fontovi
Outfit (naslov) + Inter (tekst), zeleni (lime) akcenat, krem/tamni paleta, pilničaste (pill) dugmad.

- **Temama**: svijetlo / tamno. Izbor se čuva u `localStorage` ključu `mstodo.theme`
  (default: `prefers-color-scheme`).
- **Jezici**: srpski (default) i engleski. Izbor se čuva u `localStorage` ključu `mstodo.lang`
  (default: `sr` za srpski browser, `en` za ostale).

Topbar na gornjoj strani sadrži **segment za izbor jezika** (SR / EN) i **dugme za temu**. Svi tekstovi
u UI-u i u izveženim fajlovima prate izabran jezik.

## Formati

| Format | Ekstenzija | Za šta je |
| --- | --- | --- |
| JSON | `.json` | Kompletan backup: sva polja, podzadaci, datumi, oznake |
| Markdown | `.md` | Notion, Obsidian, GitHub, bilo koji editor |
| CSV | `.csv` | Excel, Google Sheets, Numbers (UTF-8 BOM) |
| HTML | `.html` | Samostalna stranica za čitanje, štampu ili deljenje |
| ICS | `.ics` | Outlook / Google / Apple kalendar (samo zadaci sa rokom) |
| TXT | `.txt` | Čist tekst za mejl, terminal ili brzi pregled |

Kada izabereš više formata odjednom, svi idu u jedan `.zip` — tako browseri ne blokiraju
višestruka automatska preuzimanja.

## Pokretanje lokalno

Potreban je bilo koji statični server (ES moduli ne rade sa `file://`):

```bash
npm run dev          # npx serve na http://localhost:5173
# ili
python3 -m http.server 5173
```

Otvori <http://localhost:5173/?demo=1> da odmah vidiš demo podatke.

Testovi exportera:

```bash
npm test
```

## Podešavanje Microsoft prijave (jednom)

Aplikacija koristi OAuth 2.0 Authorization Code + PKCE direktno protiv
`login.microsoftonline.com`. Potrebna je jedna Azure app registracija — **client ID nije tajna**
i normalno stoji u `config.js`.

1. Otvori [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps)
   i klikni **New registration**.
2. Naziv: npr. `To Do Export`.
3. **Supported account types**: *Accounts in any organizational directory and personal Microsoft accounts*
   (ovo pokriva i lične i poslovne naloge).
4. **Redirect URI**: platforma **Single-page application (SPA)**, vrednost tačno kao adresa aplikacije:
   - lokalno: `http://localhost:5173/`
   - produkcija: `https://tvoj-domen/` ili `https://korisnik.github.io/repo/`
5. Klikni **Register** i kopiraj **Application (client) ID**.
6. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**:
   dodaj `Tasks.Read` i `User.Read`. Po potrebi klikni **Grant admin consent**.
7. Upiši client ID u `config.js`:

```js
window.MS_TODO_EXPORT_CONFIG = {
  clientId: '12345678-abcd-1234-efgh-1234567890ab',
  redirectUri: '', // prazno = trenutna adresa stranice
};
```

Ako `config.js` nije popunjen, aplikacija prikazuje polje za client ID i pamti ga u
`localStorage` — korisno za brzi lokalni test.

> **Napomena za poslovne naloge:** neki tenanti blokiraju korisnički pristanak.
> U tom slučaju administrator mora da odobri `Tasks.Read` za ovu aplikaciju.

## Objava (hosting)

Aplikacija je običan statični sajt — radi na GitHub Pages, Netlify, Vercel, Cloudflare Pages
ili bilo kom web serveru.

Za GitHub Pages je uključen workflow `.github/workflows/pages.yml`:
push na `main`, pa u **Settings → Pages** izaberi **GitHub Actions**.

Posle objave obavezno dodaj produkcijsku adresu kao **Redirect URI** u Azure app registraciji.

## Kako radi

```
index.html
  └─ src/app.js            UI, stanje, tok prijave i izvoza
       ├─ src/auth.js      OAuth 2.0 + PKCE (bez biblioteka), refresh token
       ├─ src/graph.js     Microsoft Graph: /me, liste, zadaci, checklistItems
       ├─ src/demo.js      demo podaci istog oblika kao Graph odgovor
       ├─ src/zip.js       minimalni ZIP writer (store)
       ├─ src/i18n.js      srpski / engleski prevodi (dotted keys)
       ├─ src/theme.js     svijetlo / tamno teme
       └─ src/exporters/   json, markdown, csv, html, ics, txt
```

- **Prijava** ide direktno na Microsoft; lozinka nikad ne prolazi kroz aplikaciju.
- **Access token** se čuva u `sessionStorage` i nestaje kada zatvoriš tab.
- **Podaci** se obrađuju isključivo lokalno; nema servera koji ih vidi.
- **ChecklistItems** se dohvataju po zadatku (Graph nema `$expand` za njih), pa na velikim
  nalozima učitavanje može potrajati. Broj paralelnih zahteva je ograničen na 4.
- **Deljene liste** se vide ako nalog ima pristup; liste bez pristupa se preskaču.
- **JSON** uvek izvozi sve zadatke (to je backup), dok ostali formati poštuju filter
  „Uključi završene zadatke“.

## Struktura podataka

Svaki exporter dobija isti normalizovani objekat:

```js
{
  exportedAt: '2026-11-22T10:00:00.000Z',
  account: { displayName, username, source: 'graph' | 'demo' },
  lists: [{
    id, name, wellknownListName, isOwner, isShared,
    tasks: [{
      id, title, status, importance, notes,
      due:      { iso, raw, timeZone, allDay, floating } | null,
      reminder: { ... } | null,
      isReminderOn,
      created, modified,
      completed: { ... } | null,
      categories: [],
      checklist: [{ text, checked }]
    }]
  }]
}
```

## Rešavanje problema

| Simptom | Uzrok / rešenje |
| --- | --- |
| `AADSTS50011: redirect URI mismatch` | Redirect URI u Azure-u se ne poklapa tačno sa adresom stranice (uključujući završni `/`). |
| `AADSTS65001` / consent | Administrator tenanta mora da odobri `Tasks.Read`. |
| `Interaction required` | Sesija je istekla — prijavi se ponovo. |
| Prazan ekran, „ES moduli ne rade“ | Stranica je otvorena preko `file://`. Koristi `http://localhost`. |
| Nema podzadataka | Graph je vratio grešku za tu listu; probaj ponovo ili isključi podzadatke. |
| ICS je prazan | ICS izvozi samo zadatke koji imaju rok. |

## Licenca

MIT — radi šta hoćeš.
