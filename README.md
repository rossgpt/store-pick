# Store Pick

A picking console for online grocery orders.

## Setup

Requires Node 22 or later.

```sh
npm install
```

## Seed the database

Creates `public/storepick.sqlite` from scratch. Staging timers are relative to
when you run this, so seed again right before a demo.

```sh
npm run seed
```

## Run

```sh
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173). Changes made in the
UI live in memory and are lost on refresh; re-seed to start over.
