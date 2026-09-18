import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type CertificateData = {
  certificateNo: string;
  volunteerName: string;
  nssId: string;
  eventTitle: string;
  hoursAwarded: number;
  issuedAt: Date;
  verificationUrl: string;
};

/** Renders a single certificate as a one-page A4 landscape PDF. */
export async function renderCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape, in points
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const center = (text: string, size: number, useFont = bodyFont) =>
    (width - useFont.widthOfTextAtSize(text, size)) / 2;

  page.drawText("Certificate of Participation", {
    x: center("Certificate of Participation", 28, font),
    y: height - 120,
    size: 28,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page.drawText(data.volunteerName, {
    x: center(data.volunteerName, 22, font),
    y: height - 200,
    size: 22,
    font,
  });

  const body = `NSS ID ${data.nssId} has completed "${data.eventTitle}" for ${data.hoursAwarded} hours.`;
  page.drawText(body, {
    x: center(body, 12, bodyFont),
    y: height - 240,
    size: 12,
    font: bodyFont,
  });

  page.drawText(`Certificate No: ${data.certificateNo}`, {
    x: 60,
    y: 60,
    size: 10,
    font: bodyFont,
  });

  page.drawText(`Issued: ${data.issuedAt.toISOString().slice(0, 10)}`, {
    x: 60,
    y: 44,
    size: 10,
    font: bodyFont,
  });

  page.drawText(`Verify: ${data.verificationUrl}`, {
    x: 60,
    y: 28,
    size: 10,
    font: bodyFont,
  });

  return pdfDoc.save();
}
