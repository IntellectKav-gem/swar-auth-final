# SWAR-AUTH

SWAR-AUTH is a voice-biometric attendance platform with separate Express and React applications. The canonical application code is under `SWAR-AUTH/`; the repository root contains this documentation only.

## Project layout

| Directory | Purpose |
|---|---|
| `SWAR-AUTH/backend` | Express REST API, Supabase adapter, authentication, attendance, and SpeechBrain voice engine |
| `SWAR-AUTH/frontend` | React/Vite web client for admin, faculty, and student workflows |
| `SWAR-AUTH/backend/database/migration.sql` | Canonical PostgreSQL/Supabase schema |
| `SWAR-AUTH/backend/database/rls_backend_only.sql` | RLS hardening for backend-only access |
| `SWAR-AUTH/backend/tests/test_backend.js` | End-to-end API regression suite |

## Backend setup

Use Node.js 18 or newer and Python 3.10 or newer. Install the backend dependencies with `npm ci` and install the Python dependencies into a virtual environment with `python -m pip install -r requirements.txt`.

Copy `SWAR-AUTH/backend/.env.example` to `SWAR-AUTH/backend/.env` and set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET` with at least 32 random characters, and `VOICE_PYTHON_PATH`. The server requires Supabase configuration by default. `DB_MODE=memory` is permitted only for local tests.

Apply `database/migration.sql` followed by `database/rls_backend_only.sql` in the Supabase SQL editor. The Express backend uses the server-only service role key; never expose that key to the frontend.

Start the API from `SWAR-AUTH/backend` with `npm start`. Demo seeding is disabled by default. If a disposable local database is explicitly required, set `DB_MODE=memory SEED_DATABASE=true` for that process only.

## Frontend setup

From `SWAR-AUTH/frontend`, run `npm ci`. Set `VITE_API_URL` to the backend origin when the frontend is not served through the same origin. Start the development server with `npm run dev` or build it with `npm run build`.

## Testing

The complete backend regression flow requires a running backend configured with the real SpeechBrain Python executable. From `SWAR-AUTH/backend`, start the server with explicit test-only settings such as `DB_MODE=memory`, `SEED_DATABASE=true`, a test `JWT_SECRET`, and `VOICE_PYTHON_PATH` pointing to the virtual environment. In another terminal, run `npm test`.

The voice engine intentionally fails closed when Python, SpeechBrain, model loading, or audio processing is unavailable. Synthetic audio and in-memory persistence are not production modes.

## Security notes

Voice uploads are temporary processing inputs and must not be publicly served. Production deployments should use private storage or delete files immediately after processing, restrict CORS origins, rotate secrets, and use HTTPS for microphone access.
