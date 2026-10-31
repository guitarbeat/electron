package lol.alw.electron

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.inputmethod.InputMethodManager
import android.webkit.CookieManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class MainActivity : ComponentActivity() {
    companion object {
        private const val ENTRY_URL = "https://electron.alw.lol/#movies"
        private const val TAG = "ElectronTV"
        private const val LOAD_TIMEOUT_MS = 30_000L
    }

    private lateinit var root: FrameLayout
    private lateinit var webView: WebView
    private lateinit var loading: LinearLayout
    private lateinit var errorScreen: LinearLayout
    private lateinit var retry: Button
    private val handler = Handler(Looper.getMainLooper())
    private var failed = false
    private var pageReady = false
    private var backPending = false
    private var rendererGone = false
    private val timeout = Runnable { showError("Page load timed out") }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(8, 13, 23)) }
        setContentView(root)
        // Accessing WindowInsetsController requires the decor view created by setContentView.
        hideSystemBars()
        createWebView()
        createOverlays()
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = handleBack()
        })
        // Web storage/cookies are disk-backed. Reload the canonical app URL on process restart.
        webView.loadUrl(ENTRY_URL)
    }

    private fun hideSystemBars() {
        window.setDecorFitsSystemWindows(false)
        window.insetsController?.apply {
            hide(WindowInsets.Type.systemBars())
            systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView() {
        webView = WebView(this).apply {
            setBackgroundColor(Color.rgb(8, 13, 23))
            isFocusable = true
            isFocusableInTouchMode = true
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                // Distinct marker activates the hosted app's TV-only interaction layer.
                userAgentString = "$userAgentString ElectronTV/1.0 (AFTKM)"
                useWideViewPort = true
                loadWithOverviewMode = true
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                allowFileAccess = false
                allowContentAccess = false
                setSupportMultipleWindows(false)
            }
            webChromeClient = WebChromeClient()
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (!request.isForMainFrame || isAppOrigin(request.url)) return false

                    if (request.url.scheme.equals("stremio", ignoreCase = true)) {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, request.url))
                        } catch (_: ActivityNotFoundException) {
                            Toast.makeText(
                                this@MainActivity,
                                getString(R.string.stremio_not_installed),
                                Toast.LENGTH_SHORT,
                            ).show()
                        }
                    }

                    // Only explicitly supported app links leave the WebView; block every
                    // other external scheme and origin. No native JavaScript interface.
                    return true
                }

                override fun onPageStarted(view: WebView, url: String?, favicon: android.graphics.Bitmap?) {
                    failed = false
                    pageReady = false
                    showLoading()
                    handler.removeCallbacks(timeout)
                    handler.postDelayed(timeout, LOAD_TIMEOUT_MS)
                }

                override fun onPageFinished(view: WebView, url: String?) {
                    if (failed || !isAppOrigin(Uri.parse(url ?: ""))) return
                    handler.removeCallbacks(timeout)
                    pageReady = true
                    loading.visibility = View.GONE
                    errorScreen.visibility = View.GONE
                    view.visibility = View.VISIBLE
                    view.requestFocus()
                    CookieManager.getInstance().flush()
                }

                override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (request.isForMainFrame) showError("Load error ${error.errorCode}")
                }

                override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
                    if (request.isForMainFrame) showError("HTTP ${response.statusCode}")
                }

                override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                    rendererGone = true
                    root.removeView(view)
                    view.destroy()
                    showError("WebView renderer stopped (crash=${detail.didCrash()})")
                    return true
                }
            }
        }
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }
        root.addView(webView, 0, FrameLayout.LayoutParams(-1, -1))
    }

    private fun isAppOrigin(uri: Uri): Boolean =
        uri.scheme == "https" && uri.host == "electron.alw.lol" && (uri.port == -1 || uri.port == 443)

    private fun text(value: String, size: Float) = TextView(this).apply {
        text = value
        textSize = size
        setTextColor(Color.WHITE)
        gravity = Gravity.CENTER
        setPadding(16, 12, 16, 12)
    }

    private fun panel() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        gravity = Gravity.CENTER
        setBackgroundColor(Color.rgb(8, 13, 23))
    }

    private fun createOverlays() {
        loading = panel().apply {
            addView(ProgressBar(this@MainActivity))
            addView(text(getString(R.string.loading), 24f))
        }
        retry = Button(this).apply {
            text = getString(R.string.retry)
            textSize = 24f
            setTextColor(Color.rgb(8, 13, 23))
            setBackgroundResource(R.drawable.retry_background)
            isFocusable = true
            minWidth = 220
            setOnClickListener {
                if (rendererGone) {
                    createWebView()
                    rendererGone = false
                }
                webView.loadUrl(ENTRY_URL)
            }
        }
        errorScreen = panel().apply {
            visibility = View.GONE
            addView(text(getString(R.string.load_error), 30f))
            addView(text(getString(R.string.load_error_detail), 22f))
            addView(retry, LinearLayout.LayoutParams(280, 88))
        }
        root.addView(loading, FrameLayout.LayoutParams(-1, -1))
        root.addView(errorScreen, FrameLayout.LayoutParams(-1, -1))
    }

    private fun showLoading() {
        if (!::loading.isInitialized) return
        loading.visibility = View.VISIBLE
        errorScreen.visibility = View.GONE
        webView.visibility = View.INVISIBLE
    }

    private fun showError(reason: String) {
        Log.w(TAG, reason)
        failed = true
        pageReady = false
        handler.removeCallbacks(timeout)
        if (!::errorScreen.isInitialized) return
        loading.visibility = View.GONE
        errorScreen.visibility = View.VISIBLE
        webView.visibility = View.INVISIBLE
        retry.requestFocus()
    }

    // AndroidX inherits a restricted annotation on this public Activity override.
    @SuppressLint("RestrictedApi")
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (!pageReady || rendererGone || errorScreen.visibility == View.VISIBLE) return super.dispatchKeyEvent(event)
        val key = when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
            KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
            KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
            KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_NUMPAD_ENTER -> "Enter"
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "MediaPlayPause"
            KeyEvent.KEYCODE_MEDIA_PLAY -> "MediaPlay"
            KeyEvent.KEYCODE_MEDIA_PAUSE -> "MediaPause"
            else -> return super.dispatchKeyEvent(event)
        }
        // One DOM event per native event; consume it here to avoid WebView's second focus move/click.
        val type = if (event.action == KeyEvent.ACTION_UP) "keyup" else "keydown"
        val repeat = event.repeatCount > 0
        val nativeEvent = KeyEvent(event) // Keep a copy for the asynchronous JS callback.
        webView.evaluateJavascript("""
            (() => {
                const target = document.activeElement || document.body;
                const editable = target.matches('input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=range]),textarea,[contenteditable=true]');
                const nativeControl = target.matches('select,input[type=range]');
                if ((editable || nativeControl) && '$key'.startsWith('Arrow')) return 'native';
                if (nativeControl && '$key' === 'Enter') return 'native';
                const event = new KeyboardEvent('$type', {key:'$key', code:'$key', bubbles:true, cancelable:true, repeat:$repeat});
                const unhandled = target.dispatchEvent(event);
                if (unhandled && editable) {
                    if ('$key' === 'Enter' && '$type' === 'keydown' && !$repeat) { target.focus(); return 'ime'; }
                    return 'handled';
                }
                if (unhandled && '$key' === 'Enter' && '$type' === 'keydown' && !$repeat && !editable) target.click();
                return 'handled';
            })()
        """.trimIndent()) { result ->
            if (result == "\"native\"") webView.dispatchKeyEvent(nativeEvent)
            if (result == "\"ime\"") {
                webView.requestFocus()
                (getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager)
                    .showSoftInput(webView, InputMethodManager.SHOW_IMPLICIT)
            }
        }
        return true
    }

    private fun handleBack() {
        if (!pageReady || rendererGone || errorScreen.visibility == View.VISIBLE) { finish(); return }
        if (backPending) return
        backPending = true
        webView.evaluateJavascript("""
            (() => {
                if (typeof window.electronTvBack === 'function') return window.electronTvBack();
                // Compatibility with the currently deployed site until the React update is published.
                const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
                const overlay = [...document.querySelectorAll('[role=dialog],details[open],[role=listbox]')].some(visible);
                if (overlay) {
                    (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true, cancelable:true}));
                }
                return overlay;
            })()
        """.trimIndent()) { result ->
            backPending = false
            if (!isFinishing && result != "true") {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized && !rendererGone) webView.onResume()
        hideSystemBars()
    }

    override fun onPause() {
        CookieManager.getInstance().flush()
        if (!rendererGone) webView.onPause()
        super.onPause()
    }

    override fun onStop() {
        CookieManager.getInstance().flush()
        super.onStop()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        if (!rendererGone) {
            root.removeView(webView)
            webView.destroy()
        }
        super.onDestroy()
    }
}
