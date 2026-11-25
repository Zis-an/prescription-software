# A5 print targets (default Bangladesh chamber size)

All A5 renders use the shared bodies in `../shared/*.body.html` with class `.sheet.a5`.

| Template | Body file |
|---|---|
| General | `../shared/general.body.html` |
| Pediatric | `../shared/pediatric.body.html` |
| Chronic | `../shared/chronic.body.html` |
| Patient share | `../shared/patient-share.body.html` |
| Pharmacy verify | `../shared/pharmacy-verify.body.html` |
| Serial slip | `../shared/serial-slip.body.html` |

Set paper in payload: `"meta": { "paper": "a5" }` or `PadRender.mount(..., { paper: "a5" })`.
