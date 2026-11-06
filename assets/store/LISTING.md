# Google Play setup for AnkiFlow AI

Everything Play Console asks for before a closed test can start. The images in
this folder are ready to upload.

## Store listing (Grow users → Store presence → Store listings)

**App name** (30 max): `AnkiFlow AI`

**Short description** (80 max):

```
Write Anki flashcards faster with AI, right inside your AnkiDroid decks.
```

**Full description** (4000 max):

```
AnkiFlow AI helps you finish your Anki flashcards in seconds. Open any deck from AnkiDroid, pick a card, and tap "Generate with AI" to fill in a definition, translation, example or any field you like.

WORKS WITH YOUR ANKIDROID DECKS
• Connects directly to AnkiDroid on your phone. No extra bridge app, no sync setup.
• Browse your decks and search the notes inside them.
• Edit any field and save it straight back to AnkiDroid.

AI THAT WRITES FOR FLASHCARDS
• Short, plain-text answers made for cards, not long essays.
• Results usually arrive in a few seconds.
• Add your own instruction per field, for example "one example sentence" or "translate to Spanish", and the AI follows it.
• Powered by Google Gemini.

YOUR KEY, YOUR DATA
• Bring your own free Gemini API key from Google AI Studio.
• The key is stored only on your device.
• No account, no ads, no analytics.
• Card text is sent to Google only when you tap "Generate with AI".

REQUIREMENTS
• AnkiDroid installed and opened at least once.
• A Google Gemini API key (free at aistudio.google.com).
• Internet connection for AI features.

AnkiFlow AI is an independent app and is not affiliated with AnkiDroid or Anki.
```

**Graphics**

| Field | File |
| --- | --- |
| App icon (512×512) | `icon-512.png` |
| Feature graphic (1024×500) | `feature-graphic.png` |
| Phone screenshots (1080×1920) | `screenshot-1.png` … `screenshot-4.png` |

## Store settings (Store presence → Store settings)

- App or game: **App**
- Category: **Education**
- Tags (optional): Education, Productivity
- Email: the support email you want shown publicly
- Website (optional): https://aminsajedian.github.io/ankiflow-ai/ (only if GitHub Pages is enabled for `docs/`)

## Declarations (Policy and programs → App content)

These are statements to Google, so the developer submits them.

| Section | Answer |
| --- | --- |
| Government apps | No (already saved) |
| Financial features | "My app doesn't provide any financial features" |
| Health | No health features |

## Data safety (App content → Data safety)

Based on the code in this repository (no analytics, crash reporting or ad SDKs;
the only network traffic is the Gemini request).

**Data collection and security**

- Does your app collect or share any of the required user data types? **Yes**
- Is all user data encrypted in transit? **Yes** (Gemini is called over HTTPS)
- Do you provide a way for users to request that their data is deleted? **No**.
  The app has no account or server; nothing is stored by the developer.

**Data types**

Only one type applies:

- **App activity → Other user-generated content**: the card text sent to Gemini
  when the user taps "Generate with AI".
  - Collected: **Yes**. Shared: **No**. The request goes from the device to
    Google only at the user's request.
  - Processed ephemerally: **No**. Google may keep Gemini API requests under its
    API terms, especially on the free tier.
  - Required or optional: **Optional**. The app works without AI.
  - Purpose: **App functionality**

Not collected: the Gemini API key (stays on the device), deck and note contents
read from AnkiDroid (stay on the device unless sent as above), location,
contacts, identifiers, analytics, crash logs.

**Privacy policy URL**: the one already set in App content. `docs/privacy-policy.html`
was updated on November 6, 2026 to describe the Gemini request accurately; publish
that change before submitting Data safety.
