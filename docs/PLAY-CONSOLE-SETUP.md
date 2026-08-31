# Play Console setup — Duty Pad

Your personal Play developer account is already live and BotGamers Arcade is already in internal testing. This is a **second app** on the same account. Do not reuse the Arcade listing or package name.

This has to be done in the browser while signed into that same Play account.

**Locked identity for the first upload**

| Field | Value |
|---|---|
| Package name | `com.botgamer4real.controllercalculator` |
| On-device name | Duty Pad |
| versionCode / versionName | `1` / `1.0.0` |
| Signed bundle | `android/app/build/outputs/bundle/release/app-release.aab` |
| Privacy policy | https://controller-calculator.vercel.app/privacy |
| High-res icon | `public/icon-512.png` |

The first AAB you upload **locks** `com.botgamer4real.controllercalculator` forever on this listing.

---

## 0. Build the AAB on your PC (once)

Arcade already has its own keystore. Make a **separate** upload keystore for Duty Pad. Do not copy Arcade’s `.jks` into this folder.

From `D:\balance\TimeCalculator`:

```
keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the passwords. Never commit `.jks` or `keystore.properties`.

Then:

```
npm run android:bundle
```

The file Play wants:

`D:\balance\TimeCalculator\android\app\build\outputs\bundle\release\app-release.aab`

You need JDK + Android SDK (Android Studio is enough, same as Arcade).

---

## 1. Create a new app (not Arcade)

1. [https://play.google.com/console](https://play.google.com/console) — same account as Arcade
2. Home → **Create app** (do not open Arcade and replace it)
3. App name: `Duty Pad`
4. Default language: **English (United Kingdom)**
5. App or game: **App** (Arcade was Game; this is not a game)
6. Free
7. Tick Developer Programme Policies and US export laws

You land on a new app dashboard with **Set up your app**. Work that list. Internal testing stays blocked until the required policy items are green.

---

## 2. Store listing

**Grow users → Store presence → Main store listing**

- Title: `Duty Pad`
- Short description:

```
Add and subtract paid hours in H:MM. Compare them to a duty — saving or extra.
```

- Full description:

```
Duty Pad is a minutes-only time pad for duty and operations clerks.

Type paid pieces in H:MM, add or subtract them, and compare the total to an optional duty pay time. Positive is a saving. Extra is valid and always shown.

• H:MM only — type 123 and it becomes 1:23
• Plus and minus on the pad or keyboard
• Last 3 workings on this device
• No login, no ads, no in-app purchases

This is not a timesheet, overtime engine, or drivers' hours tool. The office report stays in your office system; the pad sits beside it.
```

- App icon: upload `public/icon-512.png`
- Feature graphic: **1024×500 PNG** (Play will not publish without this). Take a wide crop of the pad or make a simple banner: dark `#071018`, teal “Duty Pad”, calculator icon on the left
- Phone screenshots: at least **2**, 9:16 or 16:9. Easiest source is the live site on your phone: [https://controller-calculator.vercel.app/](https://controller-calculator.vercel.app/)
  1. Duty Pay filled, a pay total, Saving shown
  2. Tape with `+ 10:00 + 4:00 − 1:30` and total `12:30`

**Store settings**

- App category: **Tools** (or Productivity if Tools is not offered)
- Tags: calculator, time, hours, utility
- Contact email: same public support email you used for Arcade
- Privacy policy: `https://controller-calculator.vercel.app/privacy`  
  Play will refuse testing without this URL.

---

## 3. Policy / App content

**Policy and programmes → App content.** Fill every form. This app is simpler than Arcade (no accounts).

| Form | What to choose |
|---|---|
| Privacy policy | `https://controller-calculator.vercel.app/privacy` |
| Ads | **No** |
| App access | All functionality available without login. There is no sign-in |
| Content ratings | Start questionnaire → **Utility / Productivity / Other** (not Game) → IARC. No violence, no chat, no user-generated content |
| Target audience | **Everyone** / 3+. Not designed for children. No chat, UGC, or ads |
| News app | No |
| COVID-19 | No |
| Data safety | See below |
| Government / Financial / Health | No — it is a calculator, not a payroll or banking app |
| Data deletion | Not required (no accounts) |

**Data safety** (must match the privacy page):

- Does your app collect or share user data? **No**
- Workings and stats stay on the device only
- Sold: **No**
- Account: **No**

If the form still asks about encryption / optional data, say you do not collect personal data. Do not list email or names — this app does not have them.

---

## 4. Countries / pricing

**Monetise and grow → Countries / regions** — same countries as Arcade is fine.

**Pricing** — Free. No in-app products.

---

## 5. Upload the first build (locks the package)

**Test and release → Testing → Internal testing** first. Same pattern as Arcade. Fast, no 14-day clock, you can install from Play on your Pixel.

1. Create a new release
2. Upload the `.aab` from step 0
3. Confirm Play shows package **`com.botgamer4real.controllercalculator`** — if it shows Arcade’s package you uploaded the wrong file
4. Release name: `1.0.0 (1)`
5. Let Play App Signing stay on. Google holds the app-signing key; you keep `android/upload-keystore.jks` as the **upload** key
6. Roll out to internal testers
7. Testers tab: add the **same Google account** you used for Arcade internal testing
8. Open the opt-in link on the Pixel, become a tester, install **Duty Pad** from Play (it will sit next to Arcade)

Internal testing does **not** count toward the 14 days.

---

## 6. Closed testing (this starts the 14-day clock)

Personal accounts still need this before production, even with Arcade already on the account. Each app has its own testing requirement.

**Test and release → Testing → Closed testing → Create track** (default alpha is fine).

1. Create a closed release — promote the same AAB from internal, or upload it again
2. Add testers (email list and/or Google Group). You can reuse Arcade’s tester list
3. Send the **opt-in link**. They must open it, Become a tester, then install from Play
4. You need **12 testers opted in for 14 continuous days**. Invited but not opted in does not count. If the count drops below 12, the streak can break

You can ship newer AABs later (`versionCode` 2, 3, …) on this same package without restarting the 14 days.

---

## 7. After the 14 days

**Test and release → Production** → create a production release from the closed-testing AAB (or a newer one). Production review is separate from the testing clock.

---

## Do not mix with Arcade

| | BotGamers Arcade | Duty Pad |
|---|---|---|
| Package | `com.botgamer4real.arcade` | `com.botgamer4real.controllercalculator` |
| Keystore | Arcade’s `upload-keystore.jks` | A new one in this repo’s `android/` folder |
| Privacy | botgamers-arcade.vercel.app/privacy | controller-calculator.vercel.app/privacy |
| Type | Game | App / Tools |

Losing Duty Pad’s keystore means you can never update this listing.
