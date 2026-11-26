#!/usr/bin/env python3
"""
Import Bangladesh DGDA medicine list into Clinical OS doctor/admin drug packs.

Source (default):
  F:\\conversion\\generic_magazine\\Bangladesh_Medicines_DGDA.xlsx

Outputs:
  - app-templates/frontend/clinical-os-doctor/data/dgda-drugs.js
    (doctor workbench + offline formulary; seed may copy a subset into Postgres)

TODO(dgda-auto-import): Extend this pipeline (or a Nest job) to:
  1) detect newly published DGDA rows,
  2) upsert into PostgreSQL `medicines`,
  3) refresh the offline dgda-drugs.js pack,
  without requiring developers to re-run seed manually.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

try:
    import openpyxl
except ImportError as exc:  # pragma: no cover
    raise SystemExit("openpyxl is required: pip install openpyxl") from exc

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(r"F:\conversion\generic_magazine\Bangladesh_Medicines_DGDA.xlsx")
OUT = (
    ROOT
    / "app-templates"
    / "frontend"
    / "clinical-os-doctor"
    / "data"
    / "dgda-drugs.js"
)

SHEETS = (
    "Allopathic",
    "Ayurvedic",
    "Herbal",
    "Homeopathic_Biochemic",
    "Unani",
)

COLS = (
    "id",
    "brand",
    "generic",
    "strength",
    "form",
    "company",
    "dar",
    "system",
    "useFor",
    "priceBdt",
)


def clean(value) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def make_id(dar: str, system: str, serial: str, index: int) -> str:
    if dar:
        safe = re.sub(r"[^A-Za-z0-9]+", "-", dar).strip("-")
        return f"DGDA-{safe}"
    safe_sys = re.sub(r"[^A-Za-z0-9]+", "", system)[:3].upper() or "MED"
    safe_serial = re.sub(r"[^A-Za-z0-9]+", "", serial) or str(index)
    return f"DGDA-{safe_sys}-{safe_serial}"


def parse_price(value) -> float | None:
    text = clean(value)
    if not text or text in {"0", "0.0", "0.00"}:
        return None
    try:
        return float(text.replace(",", ""))
    except ValueError:
        return None


def split_generic_strength(value: str) -> tuple[str, str]:
    """Ayurvedic/Herbal/etc. sheets often combine generic + strength in one cell."""
    text = clean(value)
    if not text:
        return "", ""
    # Common patterns: "Name 500 mg", "Name (500 mg)", "Name - 10ml"
    match = re.match(
        r"^(.*?)\s*[\(\-]?\s*(\d[\d\./]*\s*(?:mg|mcg|g|ml|%|iu|units?)(?:\s*/\s*[\d\./]+\s*(?:mg|mcg|g|ml))?)\s*[\)]?\s*$",
        text,
        flags=re.IGNORECASE,
    )
    if match:
        return clean(match.group(1)), clean(match.group(2))
    return text, ""


def normalize_row(sheet_name: str, header: tuple, raw: tuple) -> dict | None:
    if not raw or all(v is None or str(v).strip() == "" for v in raw):
        return None

    headers = [clean(h).lower() for h in header]
    values = {headers[i]: raw[i] for i in range(min(len(headers), len(raw)))}

    # Allopathic-style wide schema
    if "generic_name" in values or "retail_price_bdt" in values:
        return {
            "system": clean(values.get("medicine_system")) or sheet_name,
            "serial": clean(values.get("serial")),
            "brand": clean(values.get("brand_name")),
            "generic": clean(values.get("generic_name")),
            "strength": clean(values.get("strength")),
            "form": clean(values.get("dosage_form")),
            "company": clean(values.get("manufacturer")),
            "price": parse_price(values.get("retail_price_bdt")),
            "useFor": clean(values.get("use_for")) or "Human",
            "dar": clean(values.get("dar")),
        }

    # Compact traditional-medicine schema
    generic, strength = split_generic_strength(clean(values.get("generic_name_and_strength")))
    return {
        "system": clean(values.get("medicine_system")) or sheet_name,
        "serial": clean(values.get("serial")),
        "brand": clean(values.get("brand_name")),
        "generic": generic,
        "strength": strength,
        "form": clean(values.get("dosage_form")),
        "company": clean(values.get("manufacturer")),
        "price": None,
        "useFor": "Human",
        "dar": clean(values.get("dar")),
    }


def load_rows(xlsx: Path, human_only: bool) -> tuple[list[list], dict]:
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    rows: list[list] = []
    seen_ids: set[str] = set()
    by_system: dict[str, int] = {}
    by_use: dict[str, int] = {}
    index = 0

    for sheet_name in SHEETS:
        if sheet_name not in wb.sheetnames:
            continue
        ws = wb[sheet_name]
        iterator = ws.iter_rows(values_only=True)
        header = next(iterator, None)
        if not header:
            continue

        for raw in iterator:
            item = normalize_row(sheet_name, header, raw)
            if not item:
                continue

            use_for = item["useFor"] or "Human"
            if human_only and use_for.lower() != "human":
                continue
            if not item["brand"] and not item["generic"]:
                continue

            index += 1
            drug_id = make_id(item["dar"], item["system"], item["serial"], index)
            if drug_id in seen_ids:
                drug_id = f"{drug_id}-{index}"
            seen_ids.add(drug_id)

            rows.append(
                [
                    drug_id,
                    item["brand"],
                    item["generic"],
                    item["strength"],
                    item["form"],
                    item["company"],
                    item["dar"],
                    item["system"],
                    use_for,
                    item["price"],
                ]
            )
            by_system[item["system"]] = by_system.get(item["system"], 0) + 1
            by_use[use_for] = by_use.get(use_for, 0) + 1

    meta = {
        "source": "Bangladesh DGDA medicine register",
        "sourceFile": str(xlsx),
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "humanOnly": human_only,
        "count": len(rows),
        "bySystem": by_system,
        "byUseFor": by_use,
        "cols": list(COLS),
    }
    return rows, meta


def write_js(path: Path, rows: list[list], meta: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"meta": meta, "rows": rows}
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    banner = (
        "/* Auto-generated by scripts/import-dgda-medicines.py — do not edit by hand */\n"
        "window.ClinicalOSDrugKB = "
    )
    path.write_text(banner + body + ";\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import DGDA medicines for Clinical OS")
    parser.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX)
    parser.add_argument(
        "--include-veterinary",
        action="store_true",
        help="Include veterinary products (default: human-only for doctor prescribing)",
    )
    args = parser.parse_args()

    if not args.xlsx.exists():
        raise SystemExit(f"Excel not found: {args.xlsx}")

    human_only = not args.include_veterinary
    print(f"Reading {args.xlsx} (human_only={human_only})...")
    rows, meta = load_rows(args.xlsx, human_only=human_only)
    print(f"Imported {meta['count']} products")
    for system, count in sorted(meta["bySystem"].items(), key=lambda x: (-x[1], x[0])):
        print(f"  {system}: {count}")

    write_js(OUT, rows, meta)
    size_mb = OUT.stat().st_size / (1024 * 1024)
    print(f"Wrote {OUT} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
