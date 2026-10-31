package lol.alw.electron

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Typeface
import android.graphics.drawable.BitmapDrawable
import android.os.Handler
import android.os.Looper
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.LinearInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Native copy of the web app's OrbitLoader: Aaron and Electra orbit a turning film reel on
 * the frame beige. Sizes are in dp, which equal CSS px in the WebView (960x540 on AFTKM), and
 * every animation is phased from the wall clock exactly like the web copy, so the hand-off to
 * the page's own loader is invisible. Only View rotation is animated (RenderNode properties,
 * no redraw per frame), which is cheap on the Fire TV Stick.
 */
class BootLoaderView(context: Context) : FrameLayout(context) {
    companion object {
        const val ORBIT_MS = 5_000L
        const val REEL_MS = 8_000L
        const val DOTS_MS = 1_500L
        const val FADE_MS = 280L
    }

    private val ink = context.getColor(R.color.boot_ink)
    private val inkSoft = context.getColor(R.color.boot_ink_soft)
    private val animators = mutableListOf<ObjectAnimator>()
    private val handler = Handler(Looper.getMainLooper())
    private val dots = TextView(context)
    val status: TextView

    private val dotsTick = object : Runnable {
        override fun run() {
            val shown = ((System.currentTimeMillis() % DOTS_MS) / (DOTS_MS / 4)).toInt()
            val text = SpannableString("...")
            if (shown < 3) {
                text.setSpan(ForegroundColorSpan(0x00000000), shown, 3, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            }
            dots.text = text
            handler.postDelayed(this, (DOTS_MS / 4 - System.currentTimeMillis() % (DOTS_MS / 4)).coerceAtLeast(16L))
        }
    }

    private fun dp(value: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, resources.displayMetrics)
    private fun px(value: Float) = dp(value).toInt()

    private fun label(value: String, size: Float, color: Int, bold: Boolean = false) = TextView(context).apply {
        text = value
        setTextSize(TypedValue.COMPLEX_UNIT_DIP, size)
        setTextColor(color)
        includeFontPadding = false
        if (bold) typeface = Typeface.create("sans-serif", Typeface.BOLD)
    }

    private fun face(drawable: Int) = ImageView(context).apply {
        setImageResource(drawable)
        scaleType = ImageView.ScaleType.FIT_CENTER
        // Pixel art stays crisp, like image-rendering: pixelated on the web.
        (this.drawable as? BitmapDrawable)?.isFilterBitmap = false
    }

    private fun spin(view: View, to: Float, duration: Long) {
        animators += ObjectAnimator.ofFloat(view, View.ROTATION, 0f, to).apply {
            this.duration = duration
            interpolator = LinearInterpolator()
            repeatCount = ValueAnimator.INFINITE
        }
    }

    init {
        setBackgroundColor(context.getColor(R.color.boot_background))
        isClickable = true
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_YES
        contentDescription = context.getString(R.string.loading)

        val scene = FrameLayout(context)
        val track = View(context).apply { setBackgroundResource(R.drawable.boot_track) }
        scene.addView(track, LayoutParams(px(184f), px(184f), Gravity.CENTER))
        val reel = ImageView(context).apply { setImageResource(R.drawable.boot_reel) }
        scene.addView(reel, LayoutParams(px(56f), px(56f), Gravity.CENTER))
        val orbit = FrameLayout(context)
        val aaron = face(R.drawable.boot_aaron)
        val electra = face(R.drawable.boot_electra)
        orbit.addView(aaron, LayoutParams(px(56f), px(56f), Gravity.START or Gravity.CENTER_VERTICAL))
        orbit.addView(electra, LayoutParams(px(56f), px(56f), Gravity.END or Gravity.CENTER_VERTICAL))
        scene.addView(orbit, LayoutParams(-1, -1))
        spin(orbit, 360f, ORBIT_MS)
        spin(aaron, -360f, ORBIT_MS)
        spin(electra, -360f, ORBIT_MS)
        spin(reel, -360f, REEL_MS)

        val loadingRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            addView(label(context.getString(R.string.loading), 12.5f, inkSoft))
            dots.setTextSize(TypedValue.COMPLEX_UNIT_DIP, 12.5f)
            dots.setTextColor(inkSoft)
            dots.includeFontPadding = false
            addView(dots)
        }
        status = label("", 12.5f, inkSoft).apply { gravity = Gravity.CENTER }

        val column = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            addView(scene, LinearLayout.LayoutParams(px(240f), px(240f)).apply { bottomMargin = px(20f) })
            addView(label(context.getString(R.string.loading_names), 16f, ink, bold = true))
            addView(loadingRow, LinearLayout.LayoutParams(-2, -2).apply { topMargin = px(8f) })
            addView(status, LinearLayout.LayoutParams(-2, -2).apply { topMargin = px(14f) })
        }
        addView(column, LayoutParams(-2, -2, Gravity.CENTER))
    }

    private fun startMotion() {
        val now = System.currentTimeMillis()
        animators.forEach { animator ->
            if (!animator.isStarted) animator.start()
            animator.currentPlayTime = now % animator.duration
        }
        handler.removeCallbacks(dotsTick)
        dotsTick.run()
    }

    private fun stopMotion() {
        animators.forEach { it.cancel() }
        handler.removeCallbacks(dotsTick)
    }

    /** Shows the loader at full opacity, in phase with the web copy. */
    fun show() {
        animate().cancel()
        alpha = 1f
        visibility = VISIBLE
        startMotion()
    }

    /** Hides at once (error screen takes over). */
    fun hide() {
        animate().cancel()
        visibility = GONE
        stopMotion()
    }

    /** Cross-fades out over the page, which is painting the identical web loader underneath. */
    fun fadeOut() {
        if (visibility != VISIBLE) return
        animate().alpha(0f).setDuration(FADE_MS).withEndAction {
            visibility = GONE
            alpha = 1f
            stopMotion()
        }.start()
    }

    override fun onDetachedFromWindow() {
        stopMotion()
        super.onDetachedFromWindow()
    }
}
