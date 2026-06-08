# CodeSensai AI

CodeSensai AI is a React + Vite code review workspace that uses Gemini to review, explain, and optimize code.

## Requirements

- Node.js 18 or newer
- npm
- A valid Gemini API key from Google AI Studio
- Network access to `https://generativelanguage.googleapis.com`
- Available Gemini API quota for the Google account/project

## Environment Setup

Create a `.env.local` file in the project root:

```env
VITE_GOOGLE_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash
```

Restart the dev server after changing `.env.local`. Vite only loads environment variables when the server starts.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

## Build

```bash
npm run build
```

## Review Troubleshooting

If code review does not work:

- Confirm `.env.local` exists in the project root.
- Confirm the variable is named exactly `VITE_GOOGLE_API_KEY`.
- Restart `npm run dev` after changing `.env.local`.
- Check that the Gemini key is valid and not restricted incorrectly.
- Check quota/billing in Google AI Studio.
- Confirm the browser can reach `generativelanguage.googleapis.com`.
- Try a smaller code sample if Gemini returns an empty or blocked response.

## Security Note

This Vite app uses a browser-visible API key for local/demo usage. For production, move the Gemini request into a backend API route so the key is never shipped to users.
