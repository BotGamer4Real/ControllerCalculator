package com.botgamer4real.controllercalculator;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PlayAppUpdate playAppUpdate;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.parseColor("#071018"));
        getWindow().setNavigationBarColor(Color.parseColor("#071018"));
        playAppUpdate = new PlayAppUpdate(this);
        playAppUpdate.start();
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() == null) return;
        WebView view = getBridge().getWebView();
        if (view == null) return;
        WebSettings settings = view.getSettings();
        settings.setGeolocationEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        view.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (playAppUpdate != null) playAppUpdate.resume();
    }

    @Override
    public void onDestroy() {
        if (playAppUpdate != null) playAppUpdate.stop();
        super.onDestroy();
    }
}
