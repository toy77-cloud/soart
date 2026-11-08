# Setting up Soart

About 30–45 minutes, one time. Everything here is free. Do it on a laptop; you'll only use your phone at the end.

You'll create three things:

- **GitHub** hosts the app at `https://YOUR-USERNAME.github.io/soart/` and runs the hourly job that sends notifications.
- **Firebase** (Google) handles your login and stores your data.
- **Notification keys** let GitHub send pushes to your phone.

---

## 1. Put the code on GitHub

1. Make an account at **github.com** if you don't have one. Your username becomes part of the app's address.
2. Click **+** (top right) → **New repository**. Name it `soart`, choose **Public**, then **Create repository**.
3. On the empty repo page, click **uploading an existing file**. Unzip `soart.zip`, open the `soart` folder, select **everything inside it** (including the `icons` and `notifier` folders) and drag it onto the page. Click **Commit changes**.
4. Add the notification job. Mac and Windows hide folders that start with a dot, so create this one by hand:
   - Click **Add file → Create new file**.
   - In the name box, type exactly `.github/workflows/notify.yml` (the slashes create the folders).
   - Open `github-workflow-notify.yml` from the zip, copy all of it, and paste it in.
   - Click **Commit changes**.
5. Turn on the website: **Settings → Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main** and **/ (root)**, then **Save**. After 1–2 minutes your app is at `https://YOUR-USERNAME.github.io/soart/`. It will say "Almost there" until you finish step 5 below.

## 2. Create the Firebase project

1. Go to **console.firebase.google.com** and sign in with your Google account.
2. **Create a project** → name it `soart` → turn **off** Google Analytics → **Create project**.

## 3. Turn on login and the database

1. Left menu: **Build → Authentication → Get started**. Choose **Email/Password**, switch on the first toggle, then **Save**.
2. Left menu: **Build → Firestore Database → Create database**. Pick a US location (for example `nam5`) and choose **Start in production mode**. Click **Create**.
3. Open the **Rules** tab. Delete what's there, paste the contents of `firestore.rules`, then **Publish**. These rules make sure only you can read or change your data.

## 4. Generate the notification keys

1. Open `https://YOUR-USERNAME.github.io/soart/setup.html` and click **Generate keys**.
2. Keep that tab open. You need the public key in step 5 and both keys in step 6.
3. The private key only goes into a GitHub secret. Never paste it into a file.

## 5. Connect the app to Firebase

1. In Firebase, click the **gear** next to Project Overview → **Project settings**. Under *Your apps*, click the **`</>`** (Web) button. Nickname it `Soart`, leave Hosting unchecked, and click **Register app**.
2. You'll see a block of code with `firebaseConfig = { apiKey: ..., ... }`. Keep it open.
3. On GitHub, open `firebase-config.js` and click the **pencil** to edit. Replace each `PASTE_...` value with the matching value from Firebase. Then replace `PASTE_PUBLIC_KEY` with the **public** key from step 4. Click **Commit changes**.

These values are meant to be public. Your data is protected by the rules from step 3.

## 6. Add the secrets for notifications

1. In Firebase **Project settings → Service accounts**, click **Generate new private key → Generate key**. A `.json` file downloads. Treat it like a password.
2. On GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**, and add three secrets:

| Name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Open the downloaded `.json` file in a text editor, copy **all** of it, paste |
| `VAPID_PUBLIC` | The public key from setup.html |
| `VAPID_PRIVATE` | The private key from setup.html |

After this you can delete the `.json` file from your Downloads.

## 7. Install it on your phone

**iPhone** (iOS 16.4 or newer):
1. Open `https://YOUR-USERNAME.github.io/soart/` in **Safari** and create your account.
2. Tap **Share → Add to Home Screen → Add**.
3. Open Soart **from the home-screen icon**, not from Safari. iPhones only allow notifications from the installed app.
4. Tap the gear icon → **Turn on notifications** → **Allow**. Then tap **Send a test**.

**Android:** open the link in Chrome, sign in, then **⋮ → Install app**. Open it, then go to Settings → **Turn on notifications**.

**Laptop:** open the link in Chrome or Edge and click the install icon in the address bar.

## 8. Test the notification job

On GitHub, open **Actions → Soart notifications → Run workflow** (leave "Send the daily briefing now" checked) → **Run workflow**. Within about a minute your phone should get a briefing. If it doesn't, click the run to read its log. It says which secret is missing, if any.

After that, it runs every hour by itself:
- **Daily briefing** at the hour you pick in Settings: what's overdue, today, tomorrow, and your Top 3.
- **Deadline alerts** about 24 hours and 3 hours before each assignment is due.

GitHub's hourly runs can arrive 5–30 minutes late, so treat alerts as approximate.

## 9. Link your calendars (optional, about 5 minutes)

In Soart, open **Settings → Linked calendars**, paste a calendar link, and choose what to import it as:

- **Calendar events**: Google Calendar, iPhone/iCloud or Outlook. Your events show on the calendar, in Today's agenda and in the morning briefing.
- **School assignments**: your **Canvas calendar feed**. Every due date lands in School automatically, with the 24-hour and 3-hour alerts. In Canvas, go to Calendar and click **Calendar Feed** at the bottom right.

The "Where to find your calendar link" section under the form shows where each link lives. Links sync every hour through the same GitHub job, so a new event can take up to an hour to show up. Linked events are read-only in Soart; edit them in the original calendar.

## 10. Turn on Claude (drop-to-sort, auto-sorting, charts)

Soart uses Claude to read whatever you drop in: Canvas screenshots, syllabi, grade pages, transcripts, receipts, workout notes. It files each one in the right place.

1. Go to **console.anthropic.com**, sign up, and add a small amount of credit under **Billing** ($5 lasts a long time for personal use).
2. Open **API Keys → Create key**, then copy it.
3. In Soart, open **Settings → Claude**, paste the key and tap **Save key**.

How to use it:
- **Drag** files onto Soart, **paste** a screenshot (Cmd/Ctrl+V), or tap the **paperclip** on your phone.
- **Type** anything in the capture bar ("bench 205x5 today", "spent $14 at Chipotle", "IR paper due Friday at noon") and press Enter.
- Every sort shows what was added, with an **Undo** button.

The key is stored only in your private Soart account. You pay Anthropic per use; reading a screenshot usually costs a few cents.

---

## Good to know

- **Updating the app:** when I give you new versions of files, upload them to the repo the same way (Add file → Upload files). Then close Soart fully and reopen it twice.
- **Offline:** Soart works without signal and syncs when you're back online.
- **If notifications stop after a couple of months:** GitHub pauses scheduled jobs in repos that haven't changed in 60 days and emails you when it does. Go to **Actions → Soart notifications → Enable workflow**.
- **Backups:** Settings → Export backup downloads all your data as one file.
- **Only you:** to stop anyone else creating an account on your Firebase, go to Firebase **Authentication → Settings → User actions** and turn off "Enable create (sign-up)" once your own account exists.
