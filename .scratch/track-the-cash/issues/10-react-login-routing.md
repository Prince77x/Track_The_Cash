# 10: React login page + routing

**What to build:** The React SPA entry point — a login page that POSTs credentials to `/auth/login`, stores the JWT in memory (not localStorage), and uses React Router to redirect to the correct role-based dashboard stub. Invalid credentials show an inline error.

**Blocked by:** 05 (the `/auth/login` endpoint must be live)

**Status:** resolved

- [x] Login page renders a username/password form and a submit button
- [x] On submit, POSTs `{ "username", "password" }` to `POST /auth/login`
- [x] Successful `lea_user` login redirects to the LEA view route (`/lea`)
- [x] Successful `admin_user` login redirects to the Admin view route (`/admin`)
- [x] Failed login (401 response) shows a clear inline error message; form remains usable
- [x] JWT is stored in React in-memory state (not `localStorage` or `sessionStorage`)
- [x] React Router guards on `/lea` and `/admin` routes redirect to `/login` if no valid token is present in memory
- [x] Admin role can navigate to both `/lea` and `/admin`; LEA role is restricted to `/lea` and redirected away from `/admin`
- [x] Session is cleared (token dropped) and user is redirected to `/login` if the token is expired (8-hour expiry)
- [x] LEA view (`/lea`) and Admin view (`/admin`) can be empty stubs at this stage — they just need to render without crashing
- [x] **No Docker** — tested via React Testing Library or manual browser flow against the running FastAPI dev server; no container spin-up
