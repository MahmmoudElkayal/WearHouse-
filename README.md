# WearHouse

A lightweight frontend e-commerce storefront with authentication, product browsing, and dark/light theme support.

## Features

- **Authentication** — Sign up, sign in, and session management via cookies (with localStorage fallback for local files)
- **Product Catalogue** — Browse, search, and filter products fetched from a mock API
- **Product Detail** — View individual product pages with full information
- **Theming** — Light and dark mode with persistent preference
- **Responsive** — Mobile-friendly with slide-out sidebar navigation

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no frameworks)
- MockAPI.io for backend data
- CookieManager with localStorage fallback for file:// protocol

## Structure

```
├── index.html        # Sign-in page
├── signup.html       # Account creation
├── home.html         # Product catalogue
├── product.html      # Product detail
├── css/
│   └── style.css     # All styles (light/dark themes)
└── js/
    ├── cookieManager.js  # Cookie/localStorage utility
    ├── userModel.js      # User model + API calls
    ├── productModel.js   # Product model + API calls
    ├── authService.js    # Auth logic (login/signup/logout)
    ├── uiController.js   # DOM rendering, theme, sidebar
    └── main.js           # Page router + form handlers
```

## Getting Started

Open `index.html` directly in a browser (file:// protocol is supported via the localStorage cookie fallback), or serve it with any static server:

```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve .
```

Then navigate to `http://localhost:8000`.

## Notes

- This is a frontend-only demo project. Passwords are stored in plain text on the mock API — not suitable for production.
- Data is provided by [MockAPI.io](https://mockapi.io) and is shared publicly.
