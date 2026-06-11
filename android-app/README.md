# PokeLike Android

This project builds the APK-only PokeLike 1.6 WebView wrapper for:

`https://www.pokemin.it/`

The web game remains the source of truth, while APK-specific branding and
interface adjustments are injected by Android without modifying the web game.

## Build

```sh
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
./gradlew assembleDebug
```

The debug APK is generated at:

`app/build/outputs/apk/debug/app-debug.apk`

For public distribution, create and protect a release signing key, configure a
release signing block, and build an Android App Bundle or signed release APK.
