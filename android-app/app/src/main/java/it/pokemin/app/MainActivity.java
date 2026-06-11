package it.pokemin.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.view.View;
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

    private WebView webView;
    private ValueCallback<Uri[]> fileChooserCallback;
    private String apkCustomizations;
    private NfcAdapter nfcAdapter;
    private final NetworkDebugBridge networkDebugBridge = new NetworkDebugBridge();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.web_view);
        apkCustomizations = readAsset("apk-customizations.js");
        configureWebView();
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
                "window.handlePokeLikeNfcTag&&window.handlePokeLikeNfcTag(" +
                    JSONObject.quote(tagValue) + ")",
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
            Uri uri = record.toUri();
            if (uri != null) return uri.toString().trim();

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
            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                applyApkCustomizations(view);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                applyApkCustomizations(view);
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
