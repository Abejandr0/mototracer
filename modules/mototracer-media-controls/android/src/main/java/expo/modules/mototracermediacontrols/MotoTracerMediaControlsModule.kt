package expo.modules.mototracermediacontrols

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MotoTracerMediaControlsModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private fun listenerComponent() = ComponentName(context, MotoTracerMediaListener::class.java)

  private fun hasAccess(): Boolean {
    val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners") ?: return false
    return enabled.split(":").any { it.equals(listenerComponent().flattenToString(), ignoreCase = true) }
  }

  private fun activeController(): MediaController? {
    if (!hasAccess()) return null
    return try {
      val manager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) as MediaSessionManager
      val sessions = manager.getActiveSessions(listenerComponent())
      sessions.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING }
        ?: sessions.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PAUSED }
        ?: sessions.firstOrNull()
    } catch (_: SecurityException) {
      null
    } catch (_: IllegalStateException) {
      null
    }
  }

  override fun definition() = ModuleDefinition {
    Name("MotoTracerMediaControls")
    Function("hasNotificationAccess") { hasAccess() }
    Function("openNotificationAccessSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    }
    Function("getNowPlaying") {
      val controller = activeController() ?: return@Function null
      val metadata = controller.metadata
      val state = controller.playbackState
      val actions = state?.actions ?: 0L
      val canToggle = if (state?.state == PlaybackState.STATE_PLAYING) {
        (actions and (PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_PLAY_PAUSE)) != 0L
      } else {
        (actions and (PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PLAY_PAUSE)) != 0L
      }
      mapOf(
        "title" to metadata?.getString(MediaMetadata.METADATA_KEY_TITLE),
        "artist" to (metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)),
        "album" to metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM),
        "packageName" to controller.packageName,
        "isPlaying" to (state?.state == PlaybackState.STATE_PLAYING),
        "canPlayPause" to canToggle,
        "canSkipNext" to ((actions and PlaybackState.ACTION_SKIP_TO_NEXT) != 0L),
        "canSkipPrevious" to ((actions and PlaybackState.ACTION_SKIP_TO_PREVIOUS) != 0L)
      )
    }
    Function("control") { action: String ->
      val controller = activeController() ?: return@Function false
      val actions = controller.playbackState?.actions ?: 0L
      val transport = controller.transportControls
      when (action) {
        "toggle" -> {
          if (controller.playbackState?.state == PlaybackState.STATE_PLAYING) {
            if ((actions and (PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_PLAY_PAUSE)) == 0L) return@Function false
            transport.pause()
          } else {
            if ((actions and (PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PLAY_PAUSE)) == 0L) return@Function false
            transport.play()
          }
        }
        "next" -> if ((actions and PlaybackState.ACTION_SKIP_TO_NEXT) != 0L) transport.skipToNext() else return@Function false
        "previous" -> if ((actions and PlaybackState.ACTION_SKIP_TO_PREVIOUS) != 0L) transport.skipToPrevious() else return@Function false
        else -> return@Function false
      }
      true
    }
  }
}
