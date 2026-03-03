import re

with open('components/ui/Toast.tsx', 'r') as f:
    content = f.read()

styles_to_insert = """
const successIconStyle: React.CSSProperties = {
  flexShrink: 0,
  filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.6))',
};

const emojiIconStyle: React.CSSProperties = {
  fontSize: '20px',
  flexShrink: 0,
};

const baseCardStyle: React.CSSProperties = {
  position: 'fixed',
  top: spacing.lg,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1000,
  maxWidth: '90%',
  padding: spacing.lg,
  borderWidth: '2px',
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.md,
  color: colors.textPrimary,
  justifyContent: 'center',
};

const messageStyle: React.CSSProperties = {
  fontSize: typography.fontSize.base,
  textAlign: 'center',
  fontWeight: typography.fontWeight.medium,
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
  hyphens: 'auto',
  maxWidth: '100%',
  flex: '1 1 auto',
  minWidth: 0,
};

const dismissButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textSecondary,
  cursor: 'pointer',
  padding: spacing.xs,
  fontSize: '18px',
  lineHeight: 1,
  opacity: 0.7,
  transition: 'opacity 0.2s',
  borderRadius: radius.sm,
};
"""

# Insert the styles right before Toast definition
content = re.sub(r'const Toast: React\.FC<ToastProps> = \(', styles_to_insert + r'\nconst Toast: React.FC<ToastProps> = (', content)

# Replace <CheckIcon style={{...}} />
check_icon_regex = r'<CheckIcon\s+style=\{\{\s*color:\s*styles\.iconColor,\s*flexShrink:\s*0,\s*filter:\s*\'drop-shadow\(0 0 4px rgba\(74, 222, 128, 0\.6\)\)\',\s*\}\}\s*/>'
check_icon_replacement = r'<CheckIcon style={{ ...successIconStyle, color: styles.iconColor }} />'
content = re.sub(check_icon_regex, check_icon_replacement, content)

# Replace <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
warning_span_regex = r'<span style=\{\{ fontSize: \'20px\', flexShrink: 0 \}\}>⚠️</span>'
warning_span_replacement = r'<span style={emojiIconStyle}>⚠️</span>'
content = re.sub(warning_span_regex, warning_span_replacement, content)

# Replace <span style={{ fontSize: '20px', flexShrink: 0 }}>ℹ️</span>
info_span_regex = r'<span style=\{\{ fontSize: \'20px\', flexShrink: 0 \}\}>ℹ️</span>'
info_span_replacement = r'<span style={emojiIconStyle}>ℹ️</span>'
content = re.sub(info_span_regex, info_span_replacement, content)

# Replace <div style={{...}}>
div_regex = r'<div\s+style=\{\{\s*display:\s*\'flex\',\s*alignItems:\s*\'center\',\s*gap:\s*spacing\.md,\s*color:\s*colors\.textPrimary,\s*justifyContent:\s*\'center\',\s*\}\}\s*>'
div_replacement = r'<div style={containerStyle}>'
content = re.sub(div_regex, div_replacement, content)

# Replace <span style={{...}}>{message}</span>
span_msg_regex = r'<span\s+style=\{\{\s*fontSize:\s*typography\.fontSize\.base,\s*textAlign:\s*\'center\',\s*fontWeight:\s*typography\.fontWeight\.medium,\s*wordBreak:\s*\'break-word\',\s*overflowWrap:\s*\'break-word\',\s*hyphens:\s*\'auto\',\s*maxWidth:\s*\'100%\',\s*flex:\s*\'1 1 auto\',\s*minWidth:\s*0,\s*\}\}\s*>'
span_msg_replacement = r'<span style={messageStyle}>'
content = re.sub(span_msg_regex, span_msg_replacement, content)

# Replace <button style={{...}}>
btn_regex = r'<button\s+type="button"\s+onClick=\{handleDismiss\}\s+aria-label="Dismiss notification"\s+style=\{\{\s*background:\s*\'none\',\s*border:\s*\'none\',\s*color:\s*colors\.textSecondary,\s*cursor:\s*\'pointer\',\s*padding:\s*spacing\.xs,\s*fontSize:\s*\'18px\',\s*lineHeight:\s*1,\s*opacity:\s*0\.7,\s*transition:\s*\'opacity 0\.2s\',\s*borderRadius:\s*radius\.sm,\s*\}\}\s+onMouseEnter=\{\(e\) => \{\s*e\.currentTarget\.style\.opacity = \'1\';\s*\}\}\s+onMouseLeave=\{\(e\) => \{\s*e\.currentTarget\.style\.opacity = \'0\.7\';\s*\}\}\s*>'
btn_replacement = r'<button\n            type="button"\n            onClick={handleDismiss}\n            aria-label="Dismiss notification"\n            style={dismissButtonStyle}\n            onMouseEnter={(e) => {\n              e.currentTarget.style.opacity = \'1\';\n            }}\n            onMouseLeave={(e) => {\n              e.currentTarget.style.opacity = \'0.7\';\n            }}\n          >'
content = re.sub(btn_regex, btn_replacement, content)

# We still need to replace Card styles
card_style_regex = r'style=\{\{\s*position:\s*\'fixed\',\s*top:\s*spacing\.lg,\s*left:\s*\'50%\',\s*transform:\s*\'translateX\(-50%\)\',\s*zIndex:\s*1000,\s*maxWidth:\s*\'90%\',\s*padding:\s*spacing\.lg,\s*backgroundColor:\s*styles\.backgroundColor,\s*borderColor:\s*styles\.borderColor,\s*borderWidth:\s*\'2px\',\s*animation:\s*isExiting\s*\?\s*\'toast-slide-out 0\.3s cubic-bezier\(0\.4, 0, 0\.2, 1\) forwards\'\s*:\s*\'toast-slide-in 0\.4s cubic-bezier\(0\.16, 1, 0\.3, 1\) forwards\',\s*boxShadow:\s*styles\.shadow,\s*\}\}'
card_style_replacement = r'style={{\n        ...baseCardStyle,\n        backgroundColor: styles.backgroundColor,\n        borderColor: styles.borderColor,\n        animation: isExiting\n          ? \'toast-slide-out 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards\'\n          : \'toast-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards\',\n        boxShadow: styles.shadow,\n      }}'

content = re.sub(card_style_regex, card_style_replacement, content)

with open('components/ui/Toast.tsx', 'w') as f:
    f.write(content)
