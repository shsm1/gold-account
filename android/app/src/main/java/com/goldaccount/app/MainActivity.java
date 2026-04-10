package com.goldaccount.app;

import android.content.res.Configuration;
import android.content.res.Resources;
import android.util.DisplayMetrics;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public Resources getResources() {
        Resources resources = super.getResources();
        Configuration configuration = new Configuration();
        configuration.setToDefaults();
        
        // 固定字体缩放比例为 1.0（正常大小）
        configuration.fontScale = 1.0f;
        
        // 固定显示密度，防止"显示大小"设置影响布局
        DisplayMetrics metrics = resources.getDisplayMetrics();
        metrics.scaledDensity = metrics.density * 1.0f;
        
        resources.updateConfiguration(configuration, metrics);
        return resources;
    }
}
