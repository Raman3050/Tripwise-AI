import { jsPDF } from 'jspdf';
import type { TripPlanResponse } from '../types';

// Safe currency formatter for PDF (jsPDF standard Helvetica does not support Unicode ₹)
const moneyPdf = (amount: number) =>
  'Rs. ' + Math.round(amount || 0).toLocaleString('en-IN');

const dateLabel = (value: string) => {
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return value;
  }
};

/**
 * Sanitizes any text string for jsPDF standard fonts.
 * Replaces Unicode punctuation, currency symbols, and emojis with safe ASCII equivalents.
 */
function sanitizePdfText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/₹/g, 'Rs. ')
    .replace(/[—–]/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/•/g, '*')
    .replace(/★/g, '[*]')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, ' ') // Strip emojis and unprintable non-ASCII bytes
    .replace(/\s+/g, ' ')
    .trim();
}

export function exportTripPDF(plan: TripPlanResponse) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 18;
    }
  };

  // ─── Header Bar Accent ───
  doc.setFillColor(37, 99, 235); // Tripwise royal blue
  doc.rect(margin, y, 4, 16, 'F');

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TRIPWISE AI', margin + 8, y + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Intelligent Travel Itinerary & Booking Guide', margin + 8, y + 13);
  y += 22;

  // ─── Route & Trip Details Box ───
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'FD');

  const originSafe = sanitizePdfText(plan.trip.origin);
  const destSafe = sanitizePdfText(plan.trip.destination);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${originSafe}  ->  ${destSafe}`, margin + 6, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const startStr = dateLabel(plan.trip.startDate);
  const endStr = dateLabel(plan.trip.endDate);
  const infoLine = `${startStr} to ${endStr}  |  ${plan.trip.travelers} Travelers  |  Budget: ${moneyPdf(plan.trip.budgetInr)}`;
  doc.text(infoLine, margin + 6, y + 15);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, margin + 6, y + 20);
  y += 30;

  // ─── Executive Summary ───
  if (plan.summary) {
    checkPageBreak(25);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Trip Overview', margin, y);
    y += 6;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const cleanSummary = sanitizePdfText(plan.summary);
    const summaryLines = doc.splitTextToSize(cleanSummary, contentWidth);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 4.8 + 8;
  }

  // ─── Cost Breakdown ───
  checkPageBreak(50);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Estimated Cost Breakdown', margin, y);
  y += 6;

  const costItems: [string, number][] = [
    ['Main Transport', plan.costEstimate.transportCostInr],
    ['Accommodation', plan.costEstimate.accommodationCostInr],
    ['Food & Dining', plan.costEstimate.foodCostInr],
    ['Local Cab / Transit', plan.costEstimate.localTransportCostInr],
    ['Activities & Entry', plan.costEstimate.activitiesCostInr],
    ['Contingency Buffer', plan.costEstimate.contingencyInr],
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  costItems.forEach(([label, amount]) => {
    doc.text(label, margin, y);
    doc.text(moneyPdf(amount), pageWidth - margin, y, { align: 'right' });
    y += 5;
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Total Estimated Cost', margin, y);
  doc.text(moneyPdf(plan.costEstimate.totalInr), pageWidth - margin, y, { align: 'right' });
  y += 5;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${moneyPdf(plan.costEstimate.perPersonInr)} per person`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // ─── Transport Options ───
  if (plan.transportOptions && plan.transportOptions.length > 0) {
    checkPageBreak(35);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Transport Options', margin, y);
    y += 6;

    plan.transportOptions.forEach((opt) => {
      checkPageBreak(16);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const name = sanitizePdfText(opt.name) + (opt.recommended ? ' [Recommended]' : '');
      doc.text(name, margin, y);
      doc.text(moneyPdf(opt.totalCostInr), pageWidth - margin, y, { align: 'right' });
      y += 4.5;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const sub = `${sanitizePdfText(opt.durationLabel)}  |  ${moneyPdf(opt.perPersonCostInr)}/person  |  ${sanitizePdfText(opt.pricingLabel)}`;
      doc.text(sub, margin, y);
      y += 6;
    });
    y += 4;
  }

  // ─── Day-by-Day Itinerary ───
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Day-by-Day Itinerary', margin, y);
  y += 8;

  plan.itinerary.forEach((day) => {
    checkPageBreak(30);

    // Day Header
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y - 4, contentWidth, 10, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`Day ${day.dayNumber}: ${sanitizePdfText(day.title)}`, margin + 4, y + 2.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(dateLabel(day.date), pageWidth - margin - 4, y + 2.5, { align: 'right' });
    y += 11;

    // Narrative
    if (day.narrative) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const narrativeLines = doc.splitTextToSize(sanitizePdfText(day.narrative), contentWidth);
      doc.text(narrativeLines, margin, y);
      y += narrativeLines.length * 4 + 4;
    }

    // Activities
    day.activities.forEach((act) => {
      checkPageBreak(18);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(act.startTime || '--:--', margin + 2, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const placeText = sanitizePdfText(act.placeName);
      doc.text(placeText, margin + 20, y);
      y += 4.2;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const descLines = doc.splitTextToSize(sanitizePdfText(act.description), contentWidth - 20);
      doc.text(descLines, margin + 20, y);
      y += descLines.length * 3.8;

      if (act.travelNote || act.durationMinutes) {
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        const note = `${act.durationMinutes || 60} mins  |  ${sanitizePdfText(act.travelNote || 'Self paced')}`;
        doc.text(note, margin + 20, y);
        y += 4.5;
      }
      y += 2.5;
    });
    y += 4;
  });

  // ─── Places & Stays ───
  const addPlaceList = (sectionTitle: string, list: TripPlanResponse['attractions']) => {
    if (!list || list.length === 0) return;
    checkPageBreak(25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(sectionTitle, margin, y);
    y += 6;

    list.slice(0, 6).forEach((p) => {
      checkPageBreak(12);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(sanitizePdfText(p.name), margin, y);
      y += 3.8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(sanitizePdfText(p.address || 'Address available via map'), margin, y);
      y += 4.5;
    });
    y += 3;
  };

  addPlaceList('Recommended Stays', plan.stays);
  addPlaceList('Top Local Dining & Cafes', plan.restaurants);
  addPlaceList('Must-Visit Attractions', plan.attractions);

  // ─── Booking Links ───
  if (plan.bookingLinks && plan.bookingLinks.length > 0) {
    checkPageBreak(25);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Quick Booking Links', margin, y);
    y += 6;

    plan.bookingLinks.forEach((link) => {
      checkPageBreak(10);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.textWithLink(sanitizePdfText(link.title), margin, y, { url: link.url });
      y += 3.8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(sanitizePdfText(link.description), margin, y);
      y += 5;
    });
  }

  // ─── Footer ───
  checkPageBreak(15);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Powered by Tripwise AI - Prices and schedules are estimates. Always verify before travel.', margin, y);

  // Save
  const destClean = sanitizePdfText(plan.trip.destination).split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`Tripwise-${destClean || 'Trip'}-${plan.trip.startDate}.pdf`);
}

export function exportCalendarICS(plan: TripPlanResponse) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tripwise AI//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  plan.itinerary.forEach((day) => {
    day.activities.forEach((act) => {
      const [hh, mm] = act.startTime.split(':').map(Number);
      const start = new Date(`${day.date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
      const end = new Date(start.getTime() + act.durationMinutes * 60000);
      const fmt = (d: Date) =>
        d.getFullYear().toString() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + 'T' +
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0') + '00';

      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTART:${fmt(start)}`);
      lines.push(`DTEND:${fmt(end)}`);
      lines.push(`SUMMARY:${act.placeName}`);
      lines.push(`DESCRIPTION:${act.description.replace(/\n/g, '\\n')} — ${act.travelNote.replace(/\n/g, '\\n')}`);
      lines.push(`UID:${act.placeId}-day${day.dayNumber}@tripwise`);
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dest = plan.trip.destination.split(',')[0].trim().replace(/\s+/g, '-');
  a.download = `Tripwise-${dest}-${plan.trip.startDate}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateShareUrl(plan: TripPlanResponse): string {
  const shareData = {
    o: plan.trip.origin,
    d: plan.trip.destination,
    sd: plan.trip.startDate,
    ed: plan.trip.endDate,
    t: plan.trip.travelers,
    b: plan.trip.budgetInr,
    ts: plan.trip.travelStyle,
    pt: plan.trip.preferredTransport,
    i: plan.trip.interests,
  };
  const encoded = btoa(JSON.stringify(shareData));
  return `${window.location.origin}?share=${encodeURIComponent(encoded)}`;
}

export function parseShareUrl(): { origin: string; destination: string; startDate: string; endDate: string; travelers: number; budgetInr: number; travelStyle: string; preferredTransport: string; interests: string[] } | null {
  const params = new URLSearchParams(window.location.search);
  const share = params.get('share');
  if (!share) return null;
  try {
    const data = JSON.parse(atob(decodeURIComponent(share)));
    return {
      origin: data.o || '',
      destination: data.d || '',
      startDate: data.sd || '',
      endDate: data.ed || '',
      travelers: data.t || 2,
      budgetInr: data.b || 30000,
      travelStyle: data.ts || 'balanced',
      preferredTransport: data.pt || 'cheapest',
      interests: data.i || [],
    };
  } catch {
    return null;
  }
}
