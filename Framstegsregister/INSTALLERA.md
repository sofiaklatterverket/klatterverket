# Framstegsregistret — installation (ca 15 minuter)

Gör detta med det Google-konto som ska äga medarbetarnas utbildningsdata,
helst ett Klätterverket-konto (t.ex. utbildning@klatterverket.se).

1. **Skapa kalkylarket.** Google Drive → Nytt → Google Kalkylark.
   Döp det till *Klätterverket Academy – framstegsregister*.
2. **Lägg in skriptet.** I kalkylarket: **Tillägg → Apps Script**.
   Radera allt i `Kod.gs`, klistra in hela innehållet i filen `Kod.gs`
   från den här mappen och tryck på disketten (Spara).
3. **Installera.** Välj funktionen **installera** i listan överst och tryck **Kör**.
   Google frågar om behörighet första gången: Granska behörigheter → välj kontot →
   (Avancerat → Gå till projektet) → Tillåt.
   Nu finns flikarna *Händelser*, *Personer* och *Nycklar* i kalkylarket.
4. **Publicera som webbapp.** **Driftsätt → Ny driftsättning** → kugghjulet → **Webbapp**.
   - Beskrivning: Academy
   - Kör som: **Jag**
   - Vem har åtkomst: **Alla**
   Tryck **Driftsätt** och kopiera **webbappens URL** (slutar på `/exec`).
5. **Koppla Academy.** Öppna `redaktor.html` från mappen på datorn → Redaktörsläge →
   **Inställningar → Framstegsregister** → klistra in adressen → **Testa anslutningen**
   (ska bli grönt) → **Spara**.
6. **Publicera.** Ladda upp de tre filerna i `data/` till GitHub (mappen data →
   Add file → Upload files → Commit).
7. **Dela ut rapportnycklarna.** Fliken *Nycklar* i kalkylarket:
   - `alla` → till utbildningsansvarig
   - `ten.gasverket` → till platsansvarig på Gasverket
   - `ten.sickla` → till platsansvarig på Sickla
   Nyckeln anges i Academy under **Rapport** första gången. Byt en nyckel genom att
   skriva en ny i fliken — den gamla slutar då fungera direkt.

## Bra att veta
- Kalkylarket innehåller personuppgifter (namn, e-post, utbildningsresultat).
  Dela det inte. Informera medarbetarna om att resultaten sparas, varför, och hur länge.
- En medarbetare som slutar: radera hennes rader i *Personer* och *Händelser*.
- Ändrar du i skriptet: **Driftsätt → Hantera driftsättningar → pennan → Version: Ny version → Driftsätt**.
  Adressen ändras inte.
- Gratiskontot hos Google räcker gott för hundratals medarbetare.
