import { Platform } from 'react-native';
import type { Invoice } from './api/gym';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** Printable A4 invoice (plain, black on white — it's a document, not a screen). */
export function invoiceHtml(i: Invoice) {
  const rows: [string, string][] = [['Subtotal', money(i.subtotal)]];
  if (i.discount) rows.push(['Discount', `− ${money(i.discount)}`]);
  if (i.taxPercent) rows.push([`GST ${i.taxPercent}%`, money(i.taxAmount)]);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(i.number)}</title><style>
  *{box-sizing:border-box}body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:40px;font-size:13px}
  h1{font-size:28px;margin:0;letter-spacing:-.5px}.muted{color:#666}.row{display:flex;justify-content:space-between;gap:24px}
  table{width:100%;border-collapse:collapse;margin-top:28px}th,td{text-align:left;padding:10px 0;border-bottom:1px solid #e5e5e5}th{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#666;font-weight:600}
  td.n,th.n{text-align:right}.tot td{border:0;padding:4px 0}.grand td{font-size:16px;font-weight:700;border-top:2px solid #111;padding-top:10px}
  .stamp{display:inline-block;border:2px solid ${i.status === 'PAID' ? '#3a7d0a' : '#b45309'};color:${i.status === 'PAID' ? '#3a7d0a' : '#b45309'};padding:4px 10px;font-weight:700;letter-spacing:1px}
  </style></head><body>
  <div class="row"><div><h1>${esc(i.gym.name)}</h1><div class="muted">${[i.gym.address, i.gym.phone, i.gym.email].filter(Boolean).map(esc).join(' · ')}</div>${i.gym.gstin ? `<div class="muted">GSTIN ${esc(i.gym.gstin)}</div>` : ''}</div>
  <div style="text-align:right"><div style="font-size:20px;font-weight:700">INVOICE</div><div>${esc(i.number)}</div><div class="muted">Issued ${d(i.issuedAt)}</div>${i.dueDate ? `<div class="muted">Due ${d(i.dueDate)}</div>` : ''}</div></div>
  <div class="row" style="margin-top:28px"><div><div class="muted">Billed to</div><div style="font-weight:600">${esc(i.billTo.name)}</div>${i.billTo.memberId ? `<div class="muted">Member ${esc(i.billTo.memberId)}</div>` : ''}${i.billTo.email ? `<div class="muted">${esc(i.billTo.email)}</div>` : ''}</div>
  <div style="text-align:right"><span class="stamp">${i.status}</span></div></div>
  <table><tr><th>Description</th><th>Period</th><th class="n">Amount</th></tr>
  <tr><td>${esc(i.description)}</td><td>${i.periodStart ? `${d(i.periodStart)} – ${d(i.periodEnd)}` : '—'}</td><td class="n">${money(i.subtotal)}</td></tr></table>
  <table style="width:280px;margin-left:auto;margin-top:12px">${rows.map(([k, v]) => `<tr class="tot"><td class="muted">${k}</td><td class="n">${v}</td></tr>`).join('')}
  <tr class="grand"><td>Total</td><td class="n">${money(i.total)}</td></tr><tr class="tot"><td class="muted">Paid${i.paymentMethod ? ` (${esc(i.paymentMethod)})` : ''}</td><td class="n">${money(i.amountPaid)}</td></tr>
  <tr class="tot"><td style="font-weight:600">Balance</td><td class="n" style="font-weight:600">${money(i.balance)}</td></tr></table>
  ${i.notes ? `<p class="muted" style="margin-top:28px">${esc(i.notes)}</p>` : ''}
  <p class="muted" style="margin-top:40px;font-size:11px">Computer-generated invoice from C7 Personal Fitness Studio.</p>
  </body></html>`;
}

/** Native: render to PDF and open the share sheet. Web: open the print dialog (Save as PDF). */
export async function shareInvoice(i: Invoice) {
  const Print = await import('expo-print');
  const html = invoiceHtml(i);
  if (Platform.OS === 'web') return Print.printAsync({ html });
  const { uri } = await Print.printToFileAsync({ html });
  const Sharing = await import('expo-sharing');
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: i.number, UTI: 'com.adobe.pdf' });
  else await Print.printAsync({ uri });
}
