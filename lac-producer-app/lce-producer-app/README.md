# LAC Producers – Weather & Market Price Alerts (installable app)

React + Firebase app for vegetable producers in Lesotho.

**Features**
- Installs on the phone like a normal app (PWA)
- Detects the user's district (GPS) – someone in Mokhotlong sees Mokhotlong weather. Manual district picker as backup
- Push notifications when weather turns dangerous (frost, snow, heavy rain, heat, strong wind, storm) **or** vegetable prices change – combined into ONE message
- **Post page** has two buttons: *I'm a Seller* (post vegetables you sell) and *I'm a Buyer* (post what you want to buy: vegetable, quality grade A/B/C, quantity, price per kg, date, automatic total amount)
- **Market page** has two tabs, *For Sale* and *Buyers Wanted*, with a search box and WhatsApp buttons
- **Contact:** every listing and buy request has a WhatsApp button and a Call button (opens the phone dialer)
- **Buyer alerts:** when a buyer posts a request (e.g. tomato), every producer who has posted that vegetable in the Market and has alerts on gets a notification: *Buyer wanted: Tomato – 50 kg at M12/kg…*
- **Sold / found it:** on your own posts (the phone you posted from) a green button removes the post from the market for everyone – *Sold – remove from market* (seller) or *I found what I need – remove* (buyer)
- English and Sesotho

## One-time setup (about 20 minutes)

### 1. (Optional) your own web-push key (VAPID)
Alerts now work WITHOUT this step (Firebase uses its default key). Only do it if you want your own key.

Firebase Console → project `ict4d-c3ea2` → ⚙ Project settings → **Cloud Messaging** → **Web Push certificates** → **Generate key pair**. Copy the key.

### 2. Add it to Vercel
Vercel → your project → Settings → Environment Variables:
`REACT_APP_FIREBASE_VAPID_KEY` = the key. Then push this code to GitHub (Vercel redeploys).
For local testing copy `.env.example` to `.env.local` and paste the key.

### 3. Deploy the alert function + rules
Needs the Firebase **Blaze** (pay-as-you-go) plan – there is a free allowance that a project this size normally stays inside.

```bash
npm install -g firebase-tools
firebase login
cd functions && npm install && npm test && cd ..
firebase deploy --only functions,firestore:rules
```
> `firestore.rules` REPLACES your current rules. It keeps the marketplace working (anyone can read/post listings, and a post can be deleted so *Sold* / *Found it* work) and protects alert data. **You must deploy these rules or the remove buttons will fail.** Note: because the app has no login, the rules allow deleting any listing; the app only shows the button on your own posts. For stricter security, add Firebase Anonymous Auth later.

### 4. Test it
1. Open the Vercel link on your phone → **Turn on alerts** → allow notifications. A "Alerts are on" notification appears on the phone straight away.
2. Press **Send test alert** – a notification should arrive within seconds (needs step 3 deployed).
3. To test the real check: Google Cloud Console → Cloud Scheduler → `firebase-schedule-checkAlerts` → **Force run**.

## How the alerts decide
Edit the numbers at the top of `functions/alerts.js`:
- Frost: minimum temperature ≤ 2 °C · Heat ≥ 32 °C · Heavy rain ≥ 20 mm · Wind ≥ 45 km/h · Snow / thunderstorm codes
- Price: a crop's average price (from listings in the last 14 days, min. 2 listings) moves by ≥ 10 % **and** ≥ M0.5/kg
- Weather alerts are sent only when a NEW danger appears (no repeats every 3 hours)
- Checked every 3 hours (change `every 3 hours` in `functions/index.js`)

## Notes
- iPhone: alerts only work after Share → Add to Home Screen (iOS 16.4+). Android works from Chrome directly.
- The old OpenWeatherMap key was removed from the code (weather now uses free Open-Meteo, no key). **Delete/regenerate that key in your OpenWeatherMap account** – it was public in GitHub.
- Sesotho alert wording should be checked by a Sesotho speaker (`functions/alerts.js`, `W` and `buildMessage`).
- Market prices come from listings posted by farmers, so they are national averages, not per district.
- To get a Play Store app later, wrap this same code with Capacitor.
