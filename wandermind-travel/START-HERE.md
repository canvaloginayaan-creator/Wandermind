# START HERE — how previewing works, in plain English

You already know how this works:

> **HTML/CSS/JS + Live Server** = a **printed poster**. `index.html` is a real file with the
> words already on it. Live Server just picks that poster up and holds it in front of the
> browser. Click save, the poster changes, the browser shows the new poster.

Next.js is not a poster. It's a **kitchen**.

> **Next.js = a restaurant.** You don't hand the customer a poster. You write **recipes**
> (`app/…/page.tsx`), and a **cook** (the server) reads the recipe and makes a fresh plate
> every time someone walks in. The browser gets a finished plate of HTML — it never sees
> your `.tsx` files at all.

That cook is the thing called `npm run dev`. Everything confusing about Next.js follows from
that one difference.

---

## The two setups side by side

| | Your old way (Live Server) | This app (Next.js) |
|---|---|---|
| What runs | VS Code's Live Server extension | **Node.js**, a real program on your PC |
| Start command | click **Go Live** | type `npm run dev` in the terminal |
| Address | `http://127.0.0.1:5500/index.html` | `http://localhost:3000` |
| Is a page file opened? | yes, `index.html` | **no** — the page is built on demand |
| Close the terminal | nothing happens, files still there | **the site dies** (you switched the kitchen off) |
| Save a file | browser reloads | browser updates itself, no reload |
| Can you double-click a page file? | yes | **no** — that's not how it works |

`localhost` = "this computer". `3000` = the door number the kitchen is listening at. Same
idea as `127.0.0.1:5500`, different door.

---

## "But where is my index.html?"

There isn't one. In Next.js, **the folder names are the URLs**:

```
app/page.tsx                     →  http://localhost:3000/
app/login/page.tsx               →  http://localhost:3000/login
app/dashboard/page.tsx           →  http://localhost:3000/dashboard
app/trips/[id]/page.tsx          →  http://localhost:3000/trips/trip_hunza_spring
app/trips/[id]/budget/page.tsx   →  http://localhost:3000/trips/trip_hunza_spring/budget
```

A file **must be called `page.tsx`** to become a page. `dashboard/page.tsx` = the dashboard
page. `dashboard/thing.tsx` = just a helper file, no page, no URL.

Other folders you'll see:

| Folder | What it is | Your HTML-brain version |
|---|---|---|
| `app/` | every page and URL | your `.html` files |
| `components/` | reusable chunks (sidebar, buttons, cards) | like copy-pasted `<nav>…</nav>` blocks, but written once |
| `lib/` | the logic: database, login, budget maths, AI chat | your `script.js` |
| `public/` | images, exactly like before | your `images/` folder |

`public/img/hero.jpg` is used as `/img/hero.jpg` — identical to plain HTML. Images are the
one thing that works exactly like you expect.

---

## The terminal is the kitchen, not a launcher

When you run `npm run dev` you'll see something like:

```
▲ Next.js 15.5.29
- Local: http://localhost:3000
✓ Ready in 1528ms
```

That's the cook saying "I'm open". **Leave that window open.** If you close it, or press
Ctrl+C, or shut down the laptop — the site is gone until you run it again. It is not like
Live Server, which quietly keeps serving a file.

When you edit a page and save, the cook notices and re-cooks. The browser updates **by
itself** — you don't even reload. That's the thing people call "hot reload", and it's the
one place Next.js is genuinely nicer than Live Server.

If something breaks, **the terminal tells you the file and line number.** That's your error
message now — not the browser's console. Read the terminal first.

---

## `.tsx` looks like HTML, but isn't quite

You can absolutely edit these files. Two differences bite beginners:

```jsx
<!-- your HTML -->
<div class="card">
  <h2>Hello</h2>
  <img src="photo.jpg">
</div>
```

```jsx
// the same thing in a .tsx file
<div className="card">
  <h2>Hello</h2>
  <img src="/img/photo.jpg" />
</div>
```

1. **`class` → `className`** (because `class` is a reserved word in JavaScript).
2. Tags with nothing inside close themselves: `<img … />`, `<br />`, `<input … />`.

And you'll see curly braces doing clever things:

```jsx
<h2>{trip.title}</h2>              // prints the trip's title variable
<Sidebar active="dashboard" />    // uses one of those reusable components
```

Anything in `{}` is a JavaScript value, not literal text. If you want to change wording,
look for the plain words between tags — those are safe to edit, same as HTML.

---

## Why we're not using Live Server at all

Live Server can only serve files that already exist. It has no idea what a `.tsx` file is —
it would send you raw code, or a blank page. There's no "Preview" button in VS Code for this
project, and no port-forwarding magic. The **only** way to see it is:

```
1. open a terminal in the project folder   (Ctrl + `)
2. npm install      ← once ever, fetches the ingredients
3. npm run dev      ← every time, opens the kitchen
4. open http://localhost:3000 in your browser
```

Step 2 failing is what all the Python / `gyp` / `better-sqlite3` noise was about — that was
npm trying to **compile** one ingredient. This version of the project has no compiled
ingredients, so step 2 is now just a download.

---

## What Vercel does (the deploy route)

Vercel is a company that keeps **their** kitchen running 24/7. When you deploy, they copy
your recipes, run the grown-up version of `npm run dev` on their machines, and give you a
public address. Nothing runs on your PC. You don't even need Node installed to *use* the
deployed site — only to run it locally.

That's why the deployed URL works on your phone, and `localhost:3000` never will (localhost
means "this computer" — your phone *is* a different computer).

---

## One-sentence summary

**Live Server shows a file. Next.js runs a program.** You start the program with
`npm run dev`, it answers at `localhost:3000`, and it re-cooks the pages every time you save
a file in `app/`.
