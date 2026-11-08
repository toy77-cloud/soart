# Soart

Tasks, school deadlines, calendar, lifting PRs, money, lists and goals in one installable app, with push notifications.

- `index.html`, `styles.css`, `app.js`: the app
- `store-firebase.js`, `firebase-config.js`: login and sync (Firebase)
- `sw.js`, `manifest.webmanifest`, `icons/`: install and offline support
- `notifier/`: hourly GitHub Action that sends the daily briefing and deadline alerts
- `setup.html`: one-time generator for notification keys
- `firestore.rules`: database security rules

Setup steps: **[SETUP.md](SETUP.md)**
