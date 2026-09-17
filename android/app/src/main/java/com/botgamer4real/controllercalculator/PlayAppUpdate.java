package com.botgamer4real.controllercalculator;

import android.app.Activity;
import androidx.appcompat.app.AlertDialog;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;

final class PlayAppUpdate {
    private final Activity activity;
    private final AppUpdateManager manager;
    private boolean flowStarted;
    private boolean restartPromptShown;

    private final InstallStateUpdatedListener listener =
            state -> {
                if (state.installStatus() == InstallStatus.DOWNLOADED) {
                    promptRestart();
                }
            };

    PlayAppUpdate(Activity activity) {
        this.activity = activity;
        this.manager = AppUpdateManagerFactory.create(activity);
    }

    void start() {
        manager.registerListener(listener);
        check();
    }

    void resume() {
        check();
    }

    void stop() {
        manager.unregisterListener(listener);
    }

    private void check() {
        manager.getAppUpdateInfo()
                .addOnSuccessListener(
                        info -> {
                            if (info.installStatus() == InstallStatus.DOWNLOADED) {
                                promptRestart();
                                return;
                            }
                            if (flowStarted) return;
                            if (info.installStatus() == InstallStatus.DOWNLOADING) return;
                            if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) return;
                            if (!info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) return;
                            flowStarted = true;
                            manager.startUpdateFlow(
                                            info,
                                            activity,
                                            AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build())
                                    .addOnFailureListener(error -> flowStarted = false);
                        });
    }

    private void promptRestart() {
        if (restartPromptShown || activity.isFinishing()) return;
        restartPromptShown = true;
        new AlertDialog.Builder(activity)
                .setTitle("Update ready")
                .setMessage("Restart to install the latest Duty Pad.")
                .setPositiveButton("Restart", (dialog, which) -> manager.completeUpdate())
                .setNegativeButton("Later", (dialog, which) -> restartPromptShown = false)
                .setOnCancelListener(dialog -> restartPromptShown = false)
                .show();
    }
}
