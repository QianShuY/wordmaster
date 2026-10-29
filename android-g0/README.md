# WordMaster Android G0 Prototype

**Current Android mobile version:** see [MOBILE.md](MOBILE.md) for the 1.3.4 offline app, migration, build instructions and verified limitations. The prototype instructions below describe the preserved legacy implementation; `android:sync` now builds the current mobile app.

This is an isolated Capacitor prototype for the G0 local-storage slice. It does not import the production database or call the desktop Express server.

## Build web assets

```powershell
npm install
npm test
npm run android:sync
```

## Android prerequisites

- Node.js 22+
- JDK 21
- Android Studio with an accepted Android SDK license, Android SDK Platform 36, and a physical device or API 24+ emulator

The Capacitor template uses Gradle 8.14.3 and Android Gradle Plugin 8.13.0. From this directory, build with:

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

After installing the SDK and connecting a device/emulator, use Android Studio to run the app. Confirm a saved answer survives a force-stop/relaunch, then repeat with the device in airplane mode.

Run the native idempotency/conflict/rollback instrumentation tests on that device/emulator with:

```powershell
cd android
.\gradlew.bat :app:connectedDebugAndroidTest
```

The application ID `io.wordmaster.g0prototype` is temporary and must not be used for a release package.
