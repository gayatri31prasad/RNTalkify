# Keep class names of React Native
-keep class com.facebook.react.** { *; }

# Keep class names of Hermes
-keep class com.facebook.hermes.** { *; }

# Keep native modules and views
-keep class com.reactnative.** { *; }
-keep class com.airbnb.android.react.maps.** { *; }

# Keep Parcelable classes (important for passing objects between activities)
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep all annotations (to avoid crashes in certain libraries)
-keepattributes Annotation

# Keep OkHttp3 and Retrofit (if used)
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# Keep Firebase-related classes (if Firebase is used)
-keep class com.google.firebase.** { *; }

# Keep WorkManager classes (if used)
-keep class androidx.work.** { *; }

# Remove logging in release builds
-assumenosideeffects class android.util.Log { public static ** d(...); public static ** v(...); }

# Optimize code further
-optimizationpasses 5
-dontpreverify
-repackageclasses
-allowaccessmodification
