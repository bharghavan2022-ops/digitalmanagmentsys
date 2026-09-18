import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type GatePassData = {
  eventTitle: string;
  venueName: string;
  startTime: Date;
  volunteerName: string;
  nssId: string;
  awardedHours: number;
};

/**
 * A small printable ticket a volunteer can bring to an event as proof of
 * registration - not a verifiable credential like a Certificate (no
 * verificationHash, not persisted, generated fresh on every download), so
 * it's fine for this to be a lightweight one-off render.
 */
export async function renderGatePassPdf(data: GatePassData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([420, 595]); // roughly A6-ish ticket, portrait
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  const center = (text: string, size: number, useFont = bodyFont) =>
    (width - useFont.widthOfTextAtSize(text, size)) / 2;

  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: rgb(0.06, 0.16, 0.26) });
  page.drawText("NSS Connect", { x: 24, y: height - 45, size: 18, font, color: rgb(1, 1, 1) });
  page.drawText("Event Gate Pass", {
    x: 24,
    y: height - 62,
    size: 10,
    font: bodyFont,
    color: rgb(0.9, 0.9, 0.9),
  });

  let y = height - 110;
  const line = (label: string, value: string) => {
    page.drawText(label.toUpperCase(), { x: 24, y, size: 8, font: bodyFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(value, { x: 24, y: y - 16, size: 13, font });
    y -= 46;
  };

  line("Event", data.eventTitle);
  line("Venue", data.venueName);
  line("Date & time", data.startTime.toISOString().slice(0, 16).replace("T", " "));
  line("Volunteer", `${data.volunteerName} (${data.nssId})`);
  line("Hours on completion", `${data.awardedHours}`);

  const qrDataUrl = await QRCode.toDataURL(
    `${data.nssId}|${data.eventTitle}|${data.startTime.toISOString()}`,
    { margin: 0, width: 200 },
  );
  const qrPng = await pdfDoc.embedPng(qrDataUrl);
  page.drawImage(qrPng, { x: (width - 140) / 2, y: 60, width: 140, height: 140 });

  const footer = "Present this pass and your Digital ID at the event check-in.";
  page.drawText(footer, { x: center(footer, 8), y: 30, size: 8, font: bodyFont });

  return pdfDoc.save();
}
