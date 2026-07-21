#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  כפתור עדכון האתר · ויהי אות / ראש מילין
#  לחיצה כפולה על הקובץ הזה מעלה את כל השינויים ל-GitHub,
#  והאתר החי מתעדכן לבד תוך דקה-שתיים.
#  כתובת האתר: https://liatlazaver.github.io/let-there-be-letter/
# ─────────────────────────────────────────────────────────────

export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")" || exit 1

echo ""
echo "  ✷  עדכון האתר — ויהי אות / ראש מילין"
echo "  ────────────────────────────────────────────"
echo ""

# יש בכלל שינויים להעלות?
if [ -z "$(git status --porcelain)" ]; then
  echo "  ℹ️  אין שינויים חדשים — האתר כבר מעודכן."
  echo ""
  read -n 1 -s -r -p "  לחצי על מקש כלשהו לסגירה..."
  echo ""
  exit 0
fi

echo "  השינויים שיועלו:"
git status --short | sed 's/^/     /'
echo ""

read -r -p "  מה עודכן? (אפשר להשאיר ריק וללחוץ Enter): " MSG
if [ -z "$MSG" ]; then
  MSG="עדכון האתר — $(date '+%d/%m/%Y %H:%M')"
fi

echo ""
echo "  ⏳ מעלה ל-GitHub..."
git add -A
git commit -q -m "$MSG"
if git push -q origin main; then
  echo ""
  echo "  ✅ הועלה בהצלחה!"
  echo "  🌐 האתר יתעדכן תוך דקה-שתיים:"
  echo "     https://liatlazaver.github.io/let-there-be-letter/"
else
  echo ""
  echo "  ⚠️  ההעלאה נכשלה. בדקי חיבור לאינטרנט ונסי שוב."
  echo "     (אם הבעיה חוזרת — פני לקלוד ותראי לו את הטקסט הזה.)"
fi

echo ""
read -n 1 -s -r -p "  לחצי על מקש כלשהו לסגירה..."
echo ""
