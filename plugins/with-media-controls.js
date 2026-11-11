const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withMediaControls(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;
    application.service = application.service ?? [];
    const name = 'expo.modules.mototracermediacontrols.MotoTracerMediaListener';
    if (!application.service.some((service) => service.$?.['android:name'] === name)) {
      application.service.push({
        $: {
          'android:name': name,
          'android:label': 'MotoTracer media controls',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [{ action: [{ $: { 'android:name': 'android.service.notification.NotificationListenerService' } }] }],
      });
    }
    return mod;
  });
};
