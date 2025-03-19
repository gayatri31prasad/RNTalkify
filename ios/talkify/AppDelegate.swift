import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import WebRTC // Import WebRTC

@main
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication, 
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {
    
    self.moduleName = "talkify"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    // ✅ Initialize WebRTC Factory
    let factory = RTCPeerConnectionFactory()
    print("✅ WebRTC Initialized: \(factory)")

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
        return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
