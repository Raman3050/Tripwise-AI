import { jsPDF } from 'jspdf';
import type { TripPlanResponse } from '../types';

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const dateLabel = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function exportTripPDF(plan: TripPlanResponse) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPageBreak = (needed: number) => {
    if (y + needed > 275) { doc.addPage(); y = 20; }
  };

  // ─── Title ───
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(36, 55, 77);
  doc.text('Tripwise AI — Your Trip Plan', margin, y);
  y += 12;

  // ─── Trip summary line ───
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 110, 130);
  doc.text(`${plan.trip.origin}  →  ${plan.trip.destination}`, margin, y);
  y += 6;
  doc.text(`${dateLabel(plan.trip.startDate)} – ${dateLabel(plan.trip.endDate)}  •  ${plan.trip.travelers} travelers  •  Budget: ${money(plan.trip.budgetInr)}`, margin, y);
  y += 10;

  // ─── Summary ───
  doc.setFontSize(10);
  doc.setTextColor(60, 70, 90);
  const summaryLines = doc.splitTextToSize(plan.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 8;

  // ─── Cost Overview ───
  checkPageBreak(45);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(36, 55, 77);
  doc.text('Cost Estimate', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 70, 90);
  const costItems = [
    ['Transport', money(plan.costEstimate.transportCostInr)],
    ['Accommodation', money(plan.costEstimate.accommodationCostInr)],
    ['Food & Dining', money(plan.costEstimate.foodCostInr)],
    ['Local Transport', money(plan.costEstimate.localTransportCostInr)],
    ['Activities', money(plan.costEstimate.activitiesCostInr)],
    ['Contingency', money(plan.costEstimate.contingencyInr)],
  ];
  costItems.forEach(([label, amount]) => {
    doc.text(label, margin, y);
    doc.text(amount, pageWidth - margin, y, { align: 'right' });
    y += 5;
  });
  y += 2;
  doc.setDrawColor(200, 205, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total', margin, y);
  doc.text(money(plan.costEstimate.totalInr), pageWidth - margin, y, { align: 'right' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 140, 160);
  doc.text(`${money(plan.costEstimate.perPersonInr)} per person`, pageWidth - margin, y, { align: 'right' });
  y += 12;

  // ─── Transport Options ───
  checkPageBreak(30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(36, 55, 77);
  doc.text('Transport Options', margin, y);
  y += 8;

  plan.transportOptions.forEach((opt) => {
    checkPageBreak(18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 60, 80);
    doc.text(`${opt.name}${opt.recommended ? ' ★ Suggested' : ''}`, margin, y);
    doc.text(money(opt.totalCostInr), pageWidth - margin, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 130);
    doc.text(`${opt.durationLabel}  •  ${money(opt.perPersonCostInr)}/person  •  ${opt.pricingLabel}`, margin, y);
    y += 7;
  });
  y += 5;

  // ─── Day-by-Day Itinerary ───
  plan.itinerary.forEach((day) => {
    checkPageBreak(30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(36, 55, 77);
    doc.text(`Day ${day.dayNumber} — ${dateLabel(day.date)}`, margin, y);
    y += 6;
    doc.setFontSize(11);
    doc.text(day.title, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 110, 130);
    const narrativeLines = doc.splitTextToSize(day.narrative, contentWidth);
    doc.text(narrativeLines, margin, y);
    y += narrativeLines.length * 4 + 4;

    day.activities.forEach((act) => {
      checkPageBreak(20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 95, 120);
      doc.text(`${act.startTime}  `, margin, y);
      doc.setTextColor(50, 60, 80);
      doc.text(act.placeName, margin + 16, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 120, 140);
      const descLines = doc.splitTextToSize(act.description, contentWidth - 16);
      doc.text(descLines, margin + 16, y);
      y += descLines.length * 4;
      doc.setTextColor(140, 150, 170);
      doc.text(`${act.durationMinutes} min  •  ${act.travelNote}`, margin + 16, y);
      y += 7;
    });
    y += 4;
  });

  // ─── Places ───
  const placeSection = (title: string, places: TripPlanResponse['attractions']) => {
    if (places.length === 0) return;
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(36, 55, 77);
    doc.text(title, margin, y);
    y += 7;
    places.slice(0, 5).forEach((p) => {
      checkPageBreak(12);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50, 60, 80);
      doc.text(p.name, margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 130, 150);
      doc.text(p.address || 'Location via map', margin, y);
      y += 6;
    });
    y += 3;
  };

  placeSection('Places to Stay', plan.stays);
  placeSection('Restaurants & Cafes', plan.restaurants);
  placeSection('Attractions & Experiences', plan.attractions);

  // ─── Booking Links ───
  checkPageBreak(25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(36, 55, 77);
  doc.text('Booking & Search Links', margin, y);
  y += 7;
  plan.bookingLinks.forEach((link) => {
    checkPageBreak(10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 85, 200);
    doc.textWithLink(link.title, margin, y, { url: link.url });
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 150);
    doc.text(link.description, margin, y);
    y += 6;
  });

  // ─── Footer ───
  checkPageBreak(15);
  y += 5;
  doc.setDrawColor(200, 205, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 160, 175);
  doc.text('Generated by Tripwise AI — Prices are estimates, not live fares. Verify before booking.', margin, y);
  y += 4;
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y);

  // Save
  const dest = plan.trip.destination.split(',')[0].trim().replace(/\s+/g, '-');
  doc.save(`Tripwise-${dest}-${plan.trip.startDate}.pdf`);
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
