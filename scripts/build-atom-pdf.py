from pathlib import Path

from PIL import Image
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SLIDES = ROOT / ".codex-deck" / "rendered-v2"
OUTPUT = ROOT / "submission" / "Pulseboard_ATOM_Startup_Day_2026_RU.pdf"
PAGE_SIZE = (960, 540)


def main() -> None:
    slide_paths = [SLIDES / f"slide-{index}.png" for index in range(1, 12)]
    missing = [str(path) for path in slide_paths if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Missing rendered slides: {', '.join(missing)}")

    pdf = canvas.Canvas(str(OUTPUT), pagesize=PAGE_SIZE, pageCompression=1)
    for slide_path in slide_paths:
        with Image.open(slide_path) as source:
            image = source.convert("RGB")
            pdf.drawImage(
                ImageReader(image),
                0,
                0,
                width=PAGE_SIZE[0],
                height=PAGE_SIZE[1],
                preserveAspectRatio=True,
                mask="auto",
            )
        pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    main()
