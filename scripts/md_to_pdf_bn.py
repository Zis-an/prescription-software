#!/usr/bin/env python3
"""Convert Bengali Markdown docs to PDF via Edge headless print."""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parents[1]
FONT_REGULAR = Path(r"C:\Windows\Fonts\Nirmala.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\NirmalaB.ttf")

EDGE_CANDIDATES = [
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
]

CSS = """
@page {
  size: A4;
  margin: 18mm 16mm 20mm 16mm;
}
:root {
  --ink: #1a2e28;
  --muted: #3d5a50;
  --line: #c5d5ce;
  --accent: #0b5f4b;
  --code-bg: #f0f5f2;
  --th-bg: #e6f2ed;
}
* { box-sizing: border-box; }
html {
  font-size: 11pt;
}
body {
  font-family: "Nirmala UI", "Nirmala", "Segoe UI", sans-serif;
  color: var(--ink);
  line-height: 1.65;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
h1, h2, h3, h4 {
  font-family: "Nirmala UI", "Nirmala", sans-serif;
  color: var(--accent);
  line-height: 1.35;
  page-break-after: avoid;
}
h1 {
  font-size: 1.65rem;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 0.35rem;
  margin: 0 0 1rem;
}
h2 {
  font-size: 1.25rem;
  margin: 1.6rem 0 0.6rem;
  border-bottom: 1px solid var(--line);
  padding-bottom: 0.25rem;
}
h3 {
  font-size: 1.05rem;
  margin: 1.2rem 0 0.45rem;
  color: #0a4a3b;
}
p, li { orphans: 3; widows: 3; }
p { margin: 0.45rem 0; }
strong { color: #0a3d32; }
a { color: var(--accent); text-decoration: none; }
hr {
  border: none;
  border-top: 1px solid var(--line);
  margin: 1.2rem 0;
}
blockquote {
  margin: 0.8rem 0;
  padding: 0.55rem 0.9rem;
  border-left: 4px solid var(--accent);
  background: var(--th-bg);
  color: var(--muted);
}
code {
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.86em;
  background: var(--code-bg);
  padding: 0.05em 0.3em;
  border-radius: 3px;
}
pre {
  background: var(--code-bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.75rem 0.9rem;
  overflow-x: auto;
  font-size: 0.82rem;
  line-height: 1.45;
  page-break-inside: avoid;
}
pre code {
  background: none;
  padding: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.7rem 0 1rem;
  font-size: 0.92rem;
  page-break-inside: avoid;
}
th, td {
  border: 1px solid var(--line);
  padding: 0.4rem 0.55rem;
  vertical-align: top;
  text-align: left;
}
th {
  background: var(--th-bg);
  color: var(--accent);
  font-weight: 700;
}
tr:nth-child(even) td { background: #fafcfb; }
ul, ol { margin: 0.4rem 0 0.7rem; padding-left: 1.35rem; }
li { margin: 0.2rem 0; }
.doc-meta {
  color: var(--muted);
  font-size: 0.95rem;
  margin-bottom: 1.2rem;
}
.footer-note {
  margin-top: 2rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--line);
  font-size: 0.85rem;
  color: var(--muted);
}
"""


def find_browser() -> Path:
    for path in EDGE_CANDIDATES:
        if path.is_file():
            return path
    raise SystemExit("Edge/Chrome not found for PDF printing.")


def md_to_html(md_text: str, title: str) -> str:
    body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists", "nl2br"],
    )
    font_face = ""
    if FONT_REGULAR.is_file():
        # file:/// URL for local TTF — helps headless print embedding
        reg = FONT_REGULAR.as_uri()
        bold = FONT_BOLD.as_uri() if FONT_BOLD.is_file() else reg
        font_face = f"""
@font-face {{
  font-family: "Nirmala";
  src: url("{reg}") format("truetype");
  font-weight: 400;
}}
@font-face {{
  font-family: "Nirmala";
  src: url("{bold}") format("truetype");
  font-weight: 700;
}}
"""
    return f"""<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<style>
{font_face}
{CSS}
</style>
</head>
<body>
{body}
<p class="footer-note">ক্লিনিক্যাল ওএস (বাংলাদেশ) · বাংলা নথি · অফিসিয়াল ব্যবহার নির্দেশিকা / ওয়ার্কফ্লো</p>
</body>
</html>
"""


def html_to_pdf(html_path: Path, pdf_path: Path, browser: Path) -> None:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    # Edge/Chrome require absolute file URL
    url = html_path.resolve().as_uri()
    out = str(pdf_path.resolve())
    cmd = [
        str(browser),
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={out}",
        url,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0 or not pdf_path.is_file():
        err = (proc.stderr or proc.stdout or "").strip()
        raise SystemExit(f"PDF print failed ({proc.returncode}): {err}")


def convert(md_path: Path, pdf_path: Path, keep_html: Path | None = None) -> None:
    md_text = md_path.read_text(encoding="utf-8")
    title = md_path.stem
    html = md_to_html(md_text, title=title)

    if keep_html:
        keep_html.parent.mkdir(parents=True, exist_ok=True)
        keep_html.write_text(html, encoding="utf-8")
        html_path = keep_html
        cleanup = False
    else:
        tmp = tempfile.NamedTemporaryFile(
            suffix=".html", delete=False, mode="w", encoding="utf-8"
        )
        tmp.write(html)
        tmp.close()
        html_path = Path(tmp.name)
        cleanup = True

    try:
        browser = find_browser()
        html_to_pdf(html_path, pdf_path, browser)
        print(f"Wrote {pdf_path}")
    finally:
        if cleanup and html_path.exists():
            html_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--all",
        action="store_true",
        help="Convert docs/bn/WORKFLOW.md and USAGE_GUIDE.md",
    )
    parser.add_argument("inputs", nargs="*", type=Path, help="Markdown files")
    parser.add_argument("-o", "--output", type=Path, help="Output PDF (single input)")
    args = parser.parse_args()

    jobs: list[tuple[Path, Path]] = []
    if args.all:
        bn = ROOT / "docs" / "bn"
        out = ROOT / "docs"
        jobs = [
            (bn / "WORKFLOW.md", out / "WORKFLOW.bn.pdf"),
            (bn / "USAGE_GUIDE.md", out / "USAGE_GUIDE.bn.pdf"),
        ]
    elif args.inputs:
        for md in args.inputs:
            pdf = args.output if args.output and len(args.inputs) == 1 else md.with_suffix(".pdf")
            jobs.append((md, pdf))
    else:
        parser.print_help()
        sys.exit(1)

    html_dir = ROOT / "docs" / "bn" / "_html"
    for md_path, pdf_path in jobs:
        if not md_path.is_file():
            raise SystemExit(f"Missing: {md_path}")
        keep = html_dir / f"{md_path.stem}.html"
        convert(md_path, pdf_path, keep_html=keep)


if __name__ == "__main__":
    main()
