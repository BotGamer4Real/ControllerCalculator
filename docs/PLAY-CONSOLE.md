# Google Play — first upload

Do not change the package name after the first upload. Google treats it as the app identity forever.

| Field | Value |
|---|---|
| Package name | `com.botgamer4real.controllercalculator` |
| On-device name | **Duty Pad** |
| versionCode | `1` |
| versionName | `1.0.0` |
| Signed bundle | `android/app/build/outputs/bundle/release/app-release.aab` |
| Privacy policy | https://controller-calculator.vercel.app/privacy |
| High-res icon | `public/icon-512.png` |

## Create the app

1. [Play Console](https://play.google.com/console) → **Create app**
2. App name: `Duty Pad`
3. Default language: English (United Kingdom)
4. App or game: **App**
5. Free
6. Declare that it meets the Developer Programme Policies

## Store listing (copy)

**Title:** Duty Pad

**Short description (80 characters max):**
```
Add and subtract paid hours in H:MM. Compare them to a duty — saving or extra.
```

**Full description:**
```
Duty Pad is a minutes-only time pad for duty and operations clerks.

Type paid pieces in H:MM, add or subtract them, and compare the total to an optional duty pay time. Positive is a saving. Extra is valid and always shown.

• H:MM only — type 123 and it becomes 1:23
• Plus and minus on the pad or keyboard
• Last 3 workings on this device
• No login, no ads, no in-app purchases

This is not a timesheet, overtime engine, or drivers' hours tool. The office report stays in your office system; the pad sits beside it.
```

**App icon:** `public/icon-512.png` (512×512)

**Screenshots:** at least 2 phone shots (9:16). Capture the pad with a total, and one with tape / history.

**Feature graphic:** 1024×500 PNG.

**Category:** Tools / Productivity  
**Tags:** calculator, time, hours, payroll, utility

## Policy forms

- Ads: **No**
- In-app purchases: **No**
- Target age: **Everyone** / 3+ (no chat, not designed for children)
- Content rating: IARC questionnaire for a workplace utility
- Data safety:
  - Data collected: **No** (workings stay on the device)
  - Sold: **No**
  - Account: **No**
  - Encrypted in transit: not applicable for account data (none collected)

## Release

1. Create `android/upload-keystore.jks` and `android/keystore.properties` (never commit them)
2. `npm run android:bundle`
3. Play Console → Testing → Internal testing → upload the `.aab`
4. Closed testing (often 12–14 days on a new personal account) then Production

Losing the keystore means you cannot update this app.
