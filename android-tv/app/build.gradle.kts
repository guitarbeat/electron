plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "lol.alw.electron"
    compileSdk = 35
    defaultConfig {
        applicationId = "lol.alw.electron"
        minSdk = 30
        targetSdk = 30 // Fire OS 8 / AFTKM sideload target; no Play Store publication.
        versionCode = 2
        versionName = "1.1.0"
        ndk { abiFilters += "armeabi-v7a" }
    }
    // This companion is sideloaded on API 30 Fire OS, not submitted to Google Play.
    lint { disable += "ExpiredTargetSdkVersion" }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
dependencies {
    implementation("androidx.activity:activity-ktx:1.9.3")
}
