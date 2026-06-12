package it.pokemin.app;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.animation.LinearInterpolator;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceResponse;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;

import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String HOME_URL = "https://www.pokemin.it/";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final String UI_PREFS = "pokelike_ui";
    private static final String DARK_MODE_PREF = "dark_mode";

    private WebView webView;
    private TextView nativeBackButton;
    private LinearLayout nativeRunToolbar;
    private ImageButton nativePokedexButton;
    private TextView nativePokedexLoading;
    private LinearLayout nativeLoadingOverlay;
    private ImageView nativeLoadingPokeball;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private boolean pokedexReady;
    private boolean pendingPokedexOpen;
    private long loadingShownAt;
    private int loadingGeneration;
    private ObjectAnimator splashRotation;
    private int pokedexDotsStep;
    private final Runnable pokedexDotsAnimation = new Runnable() {
        @Override
        public void run() {
            if (
                nativePokedexLoading == null ||
                nativePokedexLoading.getVisibility() != View.VISIBLE
            ) {
                return;
            }
            pokedexDotsStep = pokedexDotsStep % 3 + 1;
            nativePokedexLoading.setText(
                pokedexDotsStep == 1 ? "." : pokedexDotsStep == 2 ? ".." : "..."
            );
            mainHandler.postDelayed(this, 320);
        }
    };
    private ValueCallback<Uri[]> fileChooserCallback;
    private String apkCustomizations;
    private NfcAdapter nfcAdapter;
    private final NetworkDebugBridge networkDebugBridge = new NetworkDebugBridge();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.web_view);
        nativeBackButton = findViewById(R.id.native_back_button);
        nativeRunToolbar = findViewById(R.id.native_run_toolbar);
        nativePokedexButton = findViewById(R.id.native_pokedex_button);
        nativePokedexLoading = findViewById(R.id.native_pokedex_loading);
        nativeLoadingOverlay = findViewById(R.id.native_loading_overlay);
        nativeLoadingPokeball = findViewById(R.id.native_loading_pokeball);
        loadingShownAt = SystemClock.elapsedRealtime();
        splashRotation = createRotation(nativeLoadingPokeball, 850);
        splashRotation.start();
        applyStoredThemeBackground();
        apkCustomizations = readAsset("apk-customizations.js");
        configureWebView();
        configureNativeControls();
        configureSafeAreaInsets();
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        requestNotificationPermission();

        if (savedInstanceState == null) {
            webView.loadUrl(HOME_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (nfcAdapter == null) return;
        int flags =
            NfcAdapter.FLAG_READER_NFC_A |
            NfcAdapter.FLAG_READER_NFC_B |
            NfcAdapter.FLAG_READER_NFC_F |
            NfcAdapter.FLAG_READER_NFC_V |
            NfcAdapter.FLAG_READER_NFC_BARCODE;
        nfcAdapter.enableReaderMode(this, this::handleNfcTag, flags, null);
    }

    @Override
    protected void onPause() {
        if (nfcAdapter != null) nfcAdapter.disableReaderMode(this);
        super.onPause();
    }

    private void handleNfcTag(Tag tag) {
        String tagValue = readNfcValue(tag);
        if (tagValue.isEmpty()) return;
        runOnUiThread(() -> {
            if (webView == null) return;
            webView.evaluateJavascript(
                "(function retry(value,attempt){" +
                    "if(window.handlePokeLikeNfcTag){" +
                        "window.handlePokeLikeNfcTag(value);return;" +
                    "}" +
                    "window.__pokelikePendingNfcTag=value;" +
                    "if(attempt<200)setTimeout(function(){retry(value,attempt+1)},100);" +
                "})(" + JSONObject.quote(tagValue) + ",0)",
                null
            );
        });
    }

    private String readNfcValue(Tag tag) {
        try {
            Ndef ndef = Ndef.get(tag);
            if (ndef != null) {
                ndef.connect();
                NdefMessage message = ndef.getNdefMessage();
                ndef.close();
                if (message != null) {
                    for (NdefRecord record : message.getRecords()) {
                        String value = readNdefRecord(record);
                        if (!value.isEmpty()) return value;
                    }
                }
            }
        } catch (Exception ignored) {}

        byte[] id = tag.getId();
        if (id == null || id.length == 0) return "";
        StringBuilder value = new StringBuilder("uid:");
        for (byte part : id) value.append(String.format("%02x", part & 0xff));
        return value.toString();
    }

    private String readNdefRecord(NdefRecord record) {
        try {
            byte[] payload = record.getPayload();
            if (payload == null || payload.length == 0) return "";
            if (record.getTnf() == NdefRecord.TNF_WELL_KNOWN &&
                Arrays.equals(record.getType(), NdefRecord.RTD_TEXT)) {
                int languageLength = payload[0] & 0x3f;
                if (payload.length > languageLength + 1) {
                    return new String(
                        payload,
                        languageLength + 1,
                        payload.length - languageLength - 1,
                        StandardCharsets.UTF_8
                    ).trim();
                }
            }

            Uri uri = record.toUri();
            if (uri != null) return uri.toString().trim();
            return new String(payload, StandardCharsets.UTF_8).trim();
        } catch (Exception ignored) {
            return "";
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
        webView.addJavascriptInterface(networkDebugBridge, "PokeLikeDebug");
        webView.addJavascriptInterface(new UiThemeBridge(), "PokeLikeTheme");
        webView.addJavascriptInterface(new NativeUiBridge(), "PokeLikeNativeUi");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(
                WebView view,
                WebResourceRequest request
            ) {
                String requestUrl = request.getUrl().toString();
                if (
                    requestUrl.contains("/js/firebase-player-registry.js") &&
                    "GET".equalsIgnoreCase(request.getMethod())
                ) {
                    try {
                        return new WebResourceResponse(
                            "application/javascript",
                            "UTF-8",
                            getAssets().open("firebase-player-registry.js")
                        );
                    } catch (IOException ignored) {}
                }
                networkDebugBridge.recordNativeRequest(
                    request.getMethod(),
                    requestUrl
                );
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                pokedexReady = false;
                pendingPokedexOpen = false;
                setPokedexLoading(false);
                applyStoredThemeBackground();
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyApkCustomizations(view);
                installNativePageBridge(view);
                hideNativeLoading();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyApkCustomizations(view);
                installNativePageBridge(view);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openUrl(view, request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openUrl(view, Uri.parse(url));
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> callback,
                FileChooserParams params
            ) {
                if (fileChooserCallback != null) {
                    fileChooserCallback.onReceiveValue(null);
                }
                fileChooserCallback = callback;
                try {
                    startActivityForResult(params.createIntent(), FILE_CHOOSER_REQUEST);
                } catch (ActivityNotFoundException error) {
                    fileChooserCallback = null;
                    Toast.makeText(MainActivity.this, R.string.file_picker_unavailable, Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        webView.setDownloadListener(createDownloadListener());
    }

    private void configureNativeControls() {
        nativeBackButton.setOnClickListener(view -> runGameCommand(
            "try{if(typeof saveRun==='function')saveRun();}catch(e){}" +
            "try{if(typeof cleanupTransientUI==='function')cleanupTransientUI();" +
            "if(typeof showScreen==='function')showScreen('title-screen');" +
            "if(typeof applyDarkMode==='function')applyDarkMode();}catch(e){}"
        ));
        findViewById(R.id.native_cup_button).setOnClickListener(
            view -> runGameCommand(
                "if(typeof openAchievementsModal==='function')openAchievementsModal()"
            )
        );
        nativePokedexButton.setOnClickListener(view -> {
            if (pokedexReady) {
                openPokedex();
            } else {
                pendingPokedexOpen = true;
                setPokedexLoading(true);
            }
        });
        findViewById(R.id.native_settings_button).setOnClickListener(
            view -> runGameCommand(
                "if(typeof openSettingsModal==='function')openSettingsModal()"
            )
        );
        findViewById(R.id.native_rerun_button).setOnClickListener(
            view -> runGameCommand(
                "if(typeof confirmResetRun==='function')confirmResetRun()"
            )
        );
    }

    private void configureSafeAreaInsets() {
        final int baseTopMargin = Math.round(
            12f * getResources().getDisplayMetrics().density
        );
        nativeRunToolbar.setOnApplyWindowInsetsListener((view, insets) -> {
            ViewGroup.MarginLayoutParams params =
                (ViewGroup.MarginLayoutParams) view.getLayoutParams();
            int safeTop = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                ? insets.getInsets(
                    WindowInsets.Type.statusBars() |
                    WindowInsets.Type.displayCutout()
                ).top
                : insets.getSystemWindowInsetTop();
            int desiredTop = baseTopMargin + safeTop;
            if (params.topMargin != desiredTop) {
                params.topMargin = desiredTop;
                view.setLayoutParams(params);
            }
            return insets;
        });
        nativeRunToolbar.requestApplyInsets();
    }

    private void runGameCommand(String command) {
        if (webView == null) return;
        webView.evaluateJavascript("(function(){" + command + "})()", null);
    }

    private void openPokedex() {
        pendingPokedexOpen = false;
        setPokedexLoading(false);
        runGameCommand(
            "if(typeof openPokedexModal==='function')openPokedexModal('normal')"
        );
    }

    private void setPokedexLoading(boolean loading) {
        nativePokedexLoading.setVisibility(loading ? View.VISIBLE : View.GONE);
        mainHandler.removeCallbacks(pokedexDotsAnimation);
        if (loading) {
            pokedexDotsStep = 0;
            mainHandler.post(pokedexDotsAnimation);
        } else {
            nativePokedexLoading.setText("");
        }
    }

    private void showNativeLoading() {
        nativeLoadingOverlay.animate().cancel();
        loadingGeneration++;
        loadingShownAt = SystemClock.elapsedRealtime();
        nativeLoadingOverlay.setAlpha(1f);
        nativeLoadingOverlay.setVisibility(View.VISIBLE);
        nativeLoadingOverlay.bringToFront();
        if (!splashRotation.isStarted()) splashRotation.start();
    }

    private void hideNativeLoading() {
        if (nativeLoadingOverlay.getVisibility() != View.VISIBLE) return;
        int generation = loadingGeneration;
        long remaining = Math.max(
            0L,
            1000L - (SystemClock.elapsedRealtime() - loadingShownAt)
        );
        mainHandler.postDelayed(() -> {
            if (generation != loadingGeneration) return;
            if (nativeLoadingOverlay.getVisibility() != View.VISIBLE) return;
            nativeLoadingOverlay.animate()
                .alpha(0f)
                .setDuration(220)
                .withEndAction(() -> {
                    nativeLoadingOverlay.setVisibility(View.GONE);
                    splashRotation.cancel();
                    nativeLoadingPokeball.setRotation(0f);
                })
                .start();
        }, remaining);
    }

    private void updateNativeControls(String screenId) {
        boolean title = "title-screen".equals(screenId);
        boolean towerSelect = "endless-stage-select".equals(screenId);
        boolean map = "map-screen".equals(screenId);

        nativeBackButton.setVisibility(!title && !towerSelect ? View.VISIBLE : View.GONE);
        nativeRunToolbar.setVisibility(map ? View.VISIBLE : View.GONE);

        if (nativeBackButton.getVisibility() == View.VISIBLE) nativeBackButton.bringToFront();
        if (nativeRunToolbar.getVisibility() == View.VISIBLE) nativeRunToolbar.bringToFront();
    }

    private ObjectAnimator createRotation(View view, long durationMs) {
        ObjectAnimator animator = ObjectAnimator.ofFloat(view, View.ROTATION, 0f, 360f);
        animator.setDuration(durationMs);
        animator.setRepeatCount(ObjectAnimator.INFINITE);
        animator.setInterpolator(new LinearInterpolator());
        return animator;
    }

    private void installNativePageBridge(WebView view) {
        view.evaluateJavascript(
            "(function(){" +
                "if(window.__pokelikeNativeBridgeInstalled){" +
                    "window.__pokelikeNativeReport&&window.__pokelikeNativeReport();return;" +
                "}" +
                "window.__pokelikeNativeBridgeInstalled=true;" +
                "window.__pokelikeNativeDexReady=false;" +
                "window.__pokelikeNativeDexButtons=[];" +
                "window.__pokelikeNativeDexDotsTimer=0;" +
                "window.__pokelikeNativeStartDexDots=function(button){" +
                    "if(button&&window.__pokelikeNativeDexButtons.indexOf(button)<0)" +
                        "window.__pokelikeNativeDexButtons.push(button);" +
                    "if(window.__pokelikeNativeDexDotsTimer)return;" +
                    "var step=0;" +
                    "window.__pokelikeNativeDexDotsTimer=setInterval(function(){" +
                        "step=step%3+1;" +
                        "window.__pokelikeNativeDexButtons.forEach(function(item){" +
                            "if(item&&document.body.contains(item))" +
                                "item.setAttribute('data-pokelike-dex-loading'," +
                                    "step===1?'.':step===2?'..':'...');" +
                        "});" +
                    "},320);" +
                "};" +
                "window.__pokelikeNativeStopDexDots=function(){" +
                    "clearInterval(window.__pokelikeNativeDexDotsTimer);" +
                    "window.__pokelikeNativeDexDotsTimer=0;" +
                    "window.__pokelikeNativeDexButtons.forEach(function(item){" +
                        "if(item)item.removeAttribute('data-pokelike-dex-loading');" +
                    "});" +
                    "window.__pokelikeNativeDexButtons=[];" +
                "};" +
                "window.__pokelikeNativeReport=function(){" +
                    "var active=document.querySelector('.screen.active');" +
                    "PokeLikeNativeUi.onScreenChanged(active?active.id:'');" +
                "};" +
                "new MutationObserver(window.__pokelikeNativeReport).observe(document.body,{" +
                    "subtree:true,attributes:true,attributeFilter:['class']" +
                "});" +
                "document.addEventListener('click',function(event){" +
                    "var target=event.target&&event.target.closest?event.target.closest('button'):null;" +
                    "if(!target)return;" +
                    "var action=target.getAttribute('onclick')||'';" +
                    "if(action.indexOf('openPokedexModal')!==-1&&!window.__pokelikeNativeDexReady){" +
                        "event.preventDefault();event.stopImmediatePropagation();" +
                        "window.__pokelikeNativeStartDexDots(target);" +
                        "PokeLikeNativeUi.onPokedexRequested();return;" +
                    "}" +
                    "if(target.id==='auth-login-btn'||target.id==='auth-register-btn'){" +
                        "setTimeout(function(){" +
                            "if(!target.disabled)return;" +
                            "PokeLikeNativeUi.onAuthLoading(true);" +
                            "var timer=setInterval(function(){" +
                                "if(!document.body.contains(target)||!target.disabled){" +
                                    "clearInterval(timer);PokeLikeNativeUi.onAuthLoading(false);" +
                                "}" +
                            "},120);" +
                            "setTimeout(function(){clearInterval(timer);" +
                                "PokeLikeNativeUi.onAuthLoading(false)},18000);" +
                        "},0);" +
                    "}" +
                "},true);" +
                "var loadData=typeof loadStaticPokedex==='function'" +
                    "?Promise.resolve(loadStaticPokedex()).catch(function(){})" +
                    ":Promise.resolve();" +
                "var loadSprites=new Promise(function(resolve){" +
                    "var done=0,images=[];" +
                    "function finish(){done++;if(done===649)resolve();}" +
                    "for(var id=1;id<=649;id++){" +
                        "var image=new Image();images.push(image);" +
                        "image.onload=finish;image.onerror=finish;" +
                        "image.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/" +
                            "sprites/pokemon/'+id+'.png';" +
                    "}" +
                    "window.__pokelikeNativeDexImages=images;" +
                "});" +
                "Promise.all([loadData,loadSprites]).then(function(){" +
                    "window.__pokelikeNativeDexReady=true;" +
                    "window.__pokelikeNativeStopDexDots();" +
                    "PokeLikeNativeUi.onPokedexReady();" +
                "});" +
                "window.__pokelikeNativeReport();" +
            "})()",
            null
        );
    }

    private void applyStoredThemeBackground() {
        boolean dark = getSharedPreferences(UI_PREFS, MODE_PRIVATE)
            .getBoolean(DARK_MODE_PREF, false);
        int color = Color.parseColor(dark ? "#11100d" : "#e8e4d8");
        if (webView != null) webView.setBackgroundColor(color);
        if (nativeLoadingOverlay != null) nativeLoadingOverlay.setBackgroundColor(color);
        getWindow().setStatusBarColor(color);
        getWindow().setNavigationBarColor(color);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = getWindow().getDecorView().getSystemUiVisibility();
            if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }
    }

    private final class UiThemeBridge {
        @JavascriptInterface
        public void setDarkMode(boolean dark) {
            SharedPreferences preferences = getSharedPreferences(UI_PREFS, MODE_PRIVATE);
            preferences.edit().putBoolean(DARK_MODE_PREF, dark).apply();
            runOnUiThread(MainActivity.this::applyStoredThemeBackground);
        }
    }

    private final class NativeUiBridge {
        @JavascriptInterface
        public void onScreenChanged(String screenId) {
            runOnUiThread(() -> updateNativeControls(screenId));
        }

        @JavascriptInterface
        public void onPokedexRequested() {
            runOnUiThread(() -> {
                pendingPokedexOpen = true;
                setPokedexLoading(true);
            });
        }

        @JavascriptInterface
        public void onPokedexReady() {
            runOnUiThread(() -> {
                pokedexReady = true;
                setPokedexLoading(false);
                if (pendingPokedexOpen) openPokedex();
            });
        }

        @JavascriptInterface
        public void onAuthLoading(boolean loading) {
            runOnUiThread(() -> {
                if (loading) showNativeLoading();
                else hideNativeLoading();
            });
        }
    }

    private static final class NetworkDebugBridge {
        private static final int MAX_ENTRIES = 300;
        private final Deque<JSONObject> entries = new ArrayDeque<>();

        private boolean looksLikeApi(String url) {
            String value = url == null ? "" : url.toLowerCase();
            return value.startsWith("https://pokelike.xyz/") ||
                value.startsWith("https://www.pokelike.xyz/") ||
                value.startsWith("https://save.pokelike.xyz/");
        }

        synchronized void recordNativeRequest(String method, String url) {
            if (!looksLikeApi(url)) return;
            addEntry("NETWORK", method, url, "", "", "");
        }

        @JavascriptInterface
        public synchronized void addClientLog(
            String type,
            String method,
            String url,
            String status,
            String duration,
            String error
        ) {
            if (!looksLikeApi(url)) return;
            addEntry(type, method, url, status, duration, error);
        }

        private void addEntry(
            String type,
            String method,
            String url,
            String status,
            String duration,
            String error
        ) {
            try {
                JSONObject entry = new JSONObject();
                entry.put("time", System.currentTimeMillis());
                entry.put("type", type == null ? "" : type);
                entry.put("method", method == null ? "" : method);
                entry.put("url", url == null ? "" : url);
                entry.put("status", status == null ? "" : status);
                entry.put("duration", duration == null ? "" : duration);
                entry.put("error", error == null ? "" : error);
                entries.addLast(entry);
                while (entries.size() > MAX_ENTRIES) entries.removeFirst();
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public synchronized String getLogs() {
            return new JSONArray(entries).toString();
        }

        @JavascriptInterface
        public synchronized void clearLogs() {
            entries.clear();
        }
    }

    private void applyApkCustomizations(WebView view) {
        Uri uri = Uri.parse(view.getUrl() == null ? "" : view.getUrl());
        String host = uri.getHost();
        if (
            apkCustomizations != null &&
            host != null &&
            (host.equals("pokemin.it") || host.equals("www.pokemin.it"))
        ) {
            view.evaluateJavascript(apkCustomizations, null);
        }
    }

    private String readAsset(String fileName) {
        StringBuilder content = new StringBuilder();
        try (
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(getAssets().open(fileName))
            )
        ) {
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append('\n');
            }
            return content.toString();
        } catch (IOException error) {
            return null;
        }
    }

    private boolean openUrl(WebView view, Uri uri) {
        String host = uri.getHost();
        String scheme = uri.getScheme();
        boolean webScheme = "https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme);
        boolean pokeminHost = host != null &&
            (host.equals("pokemin.it") || host.equals("www.pokemin.it"));

        if (webScheme && pokeminHost) {
            view.loadUrl(uri.toString());
            return true;
        }

        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, R.string.link_unavailable, Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    private DownloadListener createDownloadListener() {
        return (url, userAgent, contentDisposition, mimeType, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimeType);
                request.addRequestHeader("User-Agent", userAgent);
                request.setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                );
                request.setDestinationInExternalPublicDir(
                    Environment.DIRECTORY_DOWNLOADS,
                    android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType)
                );
                DownloadManager manager =
                    (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                manager.enqueue(request);
                Toast.makeText(this, R.string.download_started, Toast.LENGTH_SHORT).show();
            } catch (Exception error) {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            }
        };
    }

    private void requestNotificationPermission() {
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(
                new String[] { Manifest.permission.POST_NOTIFICATIONS },
                1002
            );
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || fileChooserCallback == null) return;
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
        fileChooserCallback.onReceiveValue(result);
        fileChooserCallback = null;
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);
        if (splashRotation != null) splashRotation.cancel();
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
        }
        super.onDestroy();
    }
}
