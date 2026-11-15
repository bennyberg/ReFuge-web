# ReFuge

ReFuge is a mobile-first web app that helps refugees and asylum seekers in Israel
fill out Israeli government forms. Users answer questions in Arabic or Hebrew,
and the app prints their answers onto the **official Hebrew PDF forms**, ready to
download, print, or submit.

The app was built as part of the Digital Product Jam course (2026).

## Features

- **One-time intake profile.** At sign-up, users answer a 7-step questionnaire
  (personal details, passport and visa, address, family status, employment,
  health fund, bank details, children). Every form is filled in ahead of time
  from this profile, so users don't type the same details twice.
- **Guided form flows.** Each form is a step-by-step flow with a review screen
  at the end. Unfinished forms are saved as drafts. Supported forms:
  - Child allowance request (`child-allowance-request`)
  - Child registration request (`child-registration-request`)
  - Person registration request (`person-registration-request`)
- **PDF generation.** Answers are drawn onto the original government PDFs in the
  browser, including Hebrew text, checkboxes, and a signature.
- **My documents.** Users can see, download, and delete the PDFs they made and
  the documents they uploaded.
- **Know your rights.** A searchable list of questions and answers about worker
  rights, legal status, health care, and more, which can be read aloud.
- **AI assistant.** A chat that answers questions using only the rights content
  as its source (Google Gemini).
- **Translation.** Translates text with Gemini. Personal details such as emails,
  phone numbers, and ID numbers are replaced with placeholders before the text
  is sent, and put back afterwards.
- **Languages.** Hebrew (default) and Arabic, both right-to-left.

## Tech stack

| Area           | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Framework      | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript |
| Auth, database, files | [Supabase](https://supabase.com/) (Google and email login, Postgres, Storage) |
| Languages      | [next-intl](https://next-intl.dev/)                      |
| PDF            | [pdf-lib](https://pdf-lib.js.org/) + `@pdf-lib/fontkit`  |
| AI             | Google Gemini (`gemini-2.5-flash`) via `@google/generative-ai` |
| Other          | `i18n-iso-countries`, GeoNames API (city lookup), nodemailer |

## Getting started

### Prerequisites

- Node.js 18 or later and npm
- A Supabase project
- A Google AI Studio API key for Gemini
- Optional: a [GeoNames](https://www.geonames.org/) username for city lookup

### Install

```bash
npm install
cp .env.local.template .env.local
```

### Environment variables

Fill in `.env.local`:

| Variable                         | Required | Purpose                                              |
| -------------------------------- | -------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Yes      | Supabase project URL                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Yes      | Supabase public (anon) key                           |
| `PRIVATE_SUPABASE_SERVICE_KEY`   | Yes      | Supabase service-role key, used by the server client |
| `SUPABASE_URL`                   | Yes      | Supabase project URL, used by `/api/upload-pdf`      |
| `SUPABASE_SERVICE_ROLE_KEY`      | Yes      | Supabase service-role key, used by `/api/upload-pdf` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`   | Yes      | Google OAuth client ID for "Sign in with Google"     |
| `GOOGLE_API_KEY`                 | Yes      | Gemini API key, for the AI chat and translation      |
| `NEXT_PUBLIC_ENABLE_AUTH_GUARD`  | Recommended | Set to `true` so pages require login              |
| `GEONAMES_USERNAME`              | No       | GeoNames username for city lookup (falls back to `demo`) |
| `EMAIL_ADDRESS`, `EMAIL_PASSWORD`, `EMAIL_HOST`, `EMAIL_PORT` | No | SMTP settings for sending email |

> Keep service-role keys and `GOOGLE_API_KEY` on the server only. Never give them
> a `NEXT_PUBLIC_` prefix.

To check that your Gemini key works:

```bash
GOOGLE_API_KEY=... node test-key.js
```

### Supabase setup

The app expects these tables and storage buckets:

| Type    | Name              | Contents                                         |
| ------- | ----------------- | ------------------------------------------------ |
| Table   | `profiles`        | The user's intake profile                        |
| Table   | `form_instances`  | Form drafts and submitted forms                  |
| Table   | `generated_pdfs`  | Records of the PDFs each user made               |
| Bucket  | `intake_docs`     | Documents users upload (passport, visa, etc.)    |
| Bucket  | `generated-pdfs`  | Filled PDF forms                                 |

Turn on the Google provider in Supabase Auth, and add
`http://localhost:3000/<locale>/callback` (for example `/he/callback`) as an
allowed redirect URL.

### Run

```bash
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm run start    # run the production build
npm run lint     # lint
```

Opening `/` redirects to `/he`. Arabic is at `/ar`.

## Project structure

```
app/
  [locale]/
    (auth)/              Login, signup, OAuth callback, 7-step intake questionnaire
    (app)/               Pages for logged-in users
      home/              Home screen
      dashboard/         Rights list with the AI chat
      forms/             Form list and the form flows
        <form-name>/
          WizardProvider.tsx     Holds form state across steps
          step-N/                One page per step
          review/                Final review and PDF generation
          fieldMap.ts            Where each field sits on the PDF
          intakeToPdfFields.ts   Turns answers into PDF field values
          *.pdf                  The official blank form
      documents/         The user's PDFs and uploads
      profile/           View and edit the intake profile
      rights/            Know-your-rights list
  actions/               Server actions: AI chat, translation
  api/                   geo/cities (city lookup), upload-pdf
lib/
  components/            Shared UI (navigation, AI chat, translator, language switcher…)
  pdf/fillPdfClient.ts   Draws text, checkboxes, and signatures onto PDFs
  supabase/              Supabase clients (browser, server, route, admin, middleware)
  hooks/                 useTextToSpeech
messages/                Text in each language (he.json, ar.json, en.json)
contracts/               intake-fields.json: the structure of the intake data
middleware.ts            Language routing and the login check
public/                  Fonts, icons, illustrations, blank forms
```

## How PDF filling works

1. The user's answers (intake profile plus form steps) are stored in
   `WizardProvider`.
2. `intakeToPdfFields.ts` turns them into a flat map of
   `fieldName → value`.
3. `fieldMap.ts` gives the page, x/y position, size, and type (text, checkbox,
   or signature) of each field on that form's PDF.
4. `lib/pdf/fillPdfClient.ts` loads the blank PDF and a font that can show
   Hebrew, draws each value at its position (with right-to-left support and
   automatic font sizing), and returns the finished PDF.
5. The PDF is downloaded and saved to Supabase Storage and `generated_pdfs`.

### Adding a new form

1. Add the blank PDF to the new form's folder under `app/[locale]/(app)/forms/<form-name>/`.
2. Write a `fieldMap.ts` with the position of each field on the PDF.
3. Write `intakeToPdfFields.ts` to turn the answers into those fields.
4. Copy an existing form's `WizardProvider`, `layout.tsx`, `step-N/` pages, and
   `review/` page, and change them to fit.
5. Add the form to `forms/page.tsx` and its text to `messages/*.json`.

## Languages

- Supported languages are `he` (default) and `ar`, set in `middleware.ts` and
  `i18n/request.ts`. Requests to `/en` redirect to `/he`.
- All interface text lives in `messages/<locale>.json`. When you add a key,
  add it to every language file.