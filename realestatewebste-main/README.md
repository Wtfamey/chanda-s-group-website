# Chanda's Group – Dreams Abode

Official website for **Chanda's Group** — Premium real estate across Mumbai, Navi Mumbai & Pune.

> **Live Dev:** http://localhost:5174/ &nbsp;|&nbsp; **Admin:** click the 🔑 key icon (bottom-right)

---

## 🔐 Admin Access

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `chanda@99` |

**3 ways to open admin:**
1. Click the small 🔑 key icon at the bottom-right corner of any page
2. Go to `http://yoursite.com/#admin`
3. Direct URL: `http://localhost:5174/#admin`

---

## 🚀 Deploy Online for Free (Netlify — Recommended)

### Option 1 — Drag & Drop (No Git needed, fastest)

1. Run `npm run build` in this folder — creates a `dist/` folder
2. Go to **https://app.netlify.com**
3. Sign up free with your email or GitHub
4. Drag the **`dist`** folder onto the Netlify dashboard
5. Your site is live in 30 seconds with a URL like `https://chandas-group.netlify.app`
6. To use a custom domain: Site Settings → Domain Management → Add custom domain

### Option 2 — Connect GitHub (Auto-deploys on every push)

1. Push this project to GitHub (see Git setup below)
2. Go to **https://app.netlify.com** → "Add new site" → "Import from Git"
3. Select your GitHub repo
4. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click Deploy — done. Every `git push` auto-deploys.

### Option 3 — Vercel (Also free)

1. Go to **https://vercel.com** → Import Project → GitHub repo
2. Framework: Vite (auto-detected)
3. Deploy — done. Auto-deploys on every push.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
src/
  App.tsx              ← Main website (all sections)
  types.ts             ← TypeScript types for Listing
  data.ts              ← Default listings + localStorage helpers
  index.css            ← All styles + animations
  main.tsx             ← React entry point
  assets/
    logo.png           ← Company logo
    team/              ← Real photos: vishal-chanda, vimal-hinger, etc.
    projects/          ← Real project photos: iris, daffodil, orchid, etc.
  components/
    AdminPanel.tsx     ← Full admin dashboard
    PropertyPortal.tsx ← Public listings portal
```

---

## 🏗️ Features

- **Property Portal** — searchable listings with filters, grid/list view, detail modal with image carousel
- **Admin Dashboard** — add/edit/delete listings, upload photos from device or URL, multi-image gallery
- **Real Team Photos** — founders group photo + individual shots for next-gen leaders
- **Real Project Photos** — all assets from `src/assets/` used throughout
- **localStorage persistence** — listings survive page refresh
- **Custom cursor** — teal dot + ring, optimized speed
- **Scroll reveal animations** — intersection observer based
- **Fully responsive** — mobile, tablet, desktop

---

## 🔧 Git Setup (to push to GitHub)

Install Git from https://git-scm.com/download/win then run:

```bash
git init
git add .
git commit -m "Initial commit — Chanda's Group website"
git branch -M main
git remote add origin https://github.com/Wtfamey/chanda-s-group-website.git
git push -u origin main
```

---

## 📞 Contact

**Chanda's Group** — 2nd Floor, Infinity Tower, Koparkhairane, Navi Mumbai 400 709

- Vishal Chanda: +91 98206 46335
- Email: info@chandasgroup.com
- Instagram: [@chandas_group](https://www.instagram.com/chandas_group)
- LinkedIn: [Chanda's Group](https://www.linkedin.com/company/chanda-s-group/)
