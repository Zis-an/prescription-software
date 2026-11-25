# Mobile app UI templates

## Included (MIT)
`flutter_healthcare/` — popular open-source Flutter healthcare UI ([TheAlphamerc/flutter_healthcare_app](https://github.com/TheAlphamerc/flutter_healthcare_app), MIT).

Use it as a visual/mobile navigation starting point for:
- Patient home / doctor list patterns
- Appointment detail screens
- Splash / theming

## Clinical OS mapping (what to keep / rewrite)
| Flutter screen pattern | Clinical OS target |
|---|---|
| Home / doctors | Patient no-install is SMS/QR first — keep light; doctor app is primary |
| Detail page | Patient Rx view / follow-up |
| Theme colors | Align to `#0b5f4b` clinical green |

## Alternative unbound path (often better for MVP)
Reuse **web doctor frontend** inside a mobile WebView (Flutter WebView / Capacitor / RN WebView):
- Same `frontend/clinical-os-doctor` + `templates/` print kit
- Native shell only for camera QR, share sheet, offline file cache

## Run Flutter kit (when Flutter SDK installed)
```bash
cd flutter_healthcare
flutter pub get
flutter run
```
