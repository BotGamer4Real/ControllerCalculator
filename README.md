# Duty Pad

Add paid hours in H:MM and compare them to a duty — saving or extra, by the minute.

No login. History stays on this device.

Live: https://controller-calculator.vercel.app/

## Run locally

```
npm install
npm test
npm run dev
```

Open http://localhost:3000

## Android / Play

Package name (never change after first upload): `com.botgamer4real.controllercalculator`

On-device name: **Duty Pad**

```
npm run android:sync
```

To make a signed Play bundle:

1. Create a keystore once (keep it off GitHub):

```
keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the passwords.
3. `npm run android:bundle`
4. Upload `android/app/build/outputs/bundle/release/app-release.aab`

See `docs/PLAY-CONSOLE.md`.
