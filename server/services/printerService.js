/**
 * ESC/POS thermal printer service (local printer bridge).
 *
 *   React POS -> Express Backend -> this service -> USB / Network ESC/POS printer
 *
 * This module runs on the machine physically attached to the printer.
 * Network printers (most common for POS) work out of the box over raw TCP 9100.
 * USB printers use the optional `escpos` + `escpos-usb` native dependencies; if
 * those are not installed on the host, USB printing reports a clear error
 * instead of silently failing.
 */
const net = require('net');

const ESC = '\x1b';
const GS = '\x1d';
const CMD = {
  INIT: ESC + '@',
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  DOUBLE_ON: GS + '!' + '\x11',
  DOUBLE_OFF: GS + '!' + '\x00',
  CUT: GS + 'V' + '\x42' + '\x00',
  DRAWER: ESC + 'p' + '\x00' + '\x19' + '\xfa',
};

function widthChars(paperWidth) {
  return Number(paperWidth) === 58 ? 32 : 48;
}

function line(char, width) {
  return char.repeat(width) + '\n';
}

function twoCols(left, right, width) {
  const r = String(right);
  const l = String(left).slice(0, Math.max(0, width - r.length - 1));
  return l + ' '.repeat(Math.max(1, width - l.length - r.length)) + r + '\n';
}

function center(text, width) {
  const t = String(text).slice(0, width);
  const pad = Math.max(0, Math.floor((width - t.length) / 2));
  return ' '.repeat(pad) + t + '\n';
}

function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Build the plain-text receipt body (also used for the on-screen preview). */
function buildReceiptText(sale, settings, { reprint = false } = {}) {
  const w = widthChars(settings.paperWidth);
  const cur = settings.currency || '$';
  const m = (n) => cur + Number(n || 0).toFixed(2);
  let out = '';

  out += line('-', w);
  out += center((settings.businessName || 'MARKET').toUpperCase(), w);
  if (settings.address) out += center(settings.address, w);
  if (settings.phone) out += center(settings.phone, w);
  out += line('-', w);
  out += '\n';
  if (reprint) out += center('*** REPRINT ***', w);
  out += `Date: ${formatDate(new Date(sale.createdAt))}\n`;
  out += `Receipt #: ${sale.receiptNumber}\n`;
  out += `Cashier: ${sale.user ? sale.user.name : '-'}\n`;
  out += '\n';

  for (const item of sale.items) {
    out += twoCols(item.productName, m(item.subtotal), w);
    if (item.quantity !== 1) {
      out += `   ${item.quantity} x ${m(item.unitPrice)}\n`;
    }
    if (item.discount > 0) out += twoCols('   Discount', '-' + m(item.discount), w);
  }

  out += line('-', w);
  out += twoCols('Subtotal', m(sale.subtotal), w);
  out += twoCols('Discount', m(sale.discount), w);
  if (settings.taxEnabled) out += twoCols(`Tax (${settings.taxRate}%)`, m(sale.tax), w);
  out += twoCols('TOTAL', m(sale.total), w);
  out += line('-', w);
  out += '\n';
  out += `Payment: ${sale.paymentMethod}\n`;
  if (sale.paymentMethod === 'CASH') {
    out += twoCols('Received', m(sale.amountReceived), w);
    out += twoCols('Change', m(sale.changeAmount), w);
  }
  out += '\n';
  out += center(settings.receiptFooter || 'Thank you!', w);
  out += line('-', w);
  return out;
}

function toEscPos(text, { center: centered = false } = {}) {
  return (
    CMD.INIT +
    (centered ? CMD.ALIGN_CENTER : CMD.ALIGN_LEFT) +
    text +
    '\n\n\n' +
    CMD.CUT
  );
}

function printNetwork(payload, ip, port) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.once('error', reject);
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error(`Printer at ${ip}:${port} did not respond`));
    });
    socket.connect(port, ip, () => {
      socket.write(Buffer.from(payload, 'binary'), () => socket.end());
    });
    socket.once('close', () => resolve({ ok: true, transport: 'NETWORK' }));
  });
}

function printUsb(payload) {
  return new Promise((resolve, reject) => {
    let escpos;
    try {
      escpos = require('escpos');
      escpos.USB = require('escpos-usb');
    } catch (e) {
      return reject(
        new Error(
          'USB printing requires the optional "escpos" and "escpos-usb" packages plus libusb on this machine. Install them on the POS computer, or use a network printer.'
        )
      );
    }
    try {
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);
      device.open((err) => {
        if (err) return reject(err);
        printer.raw(Buffer.from(payload, 'binary'));
        printer.close(() => resolve({ ok: true, transport: 'USB' }));
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function sendToPrinter(payload, settings) {
  const type = (settings.printerType || 'NONE').toUpperCase();
  if (type === 'NONE') {
    return { ok: false, transport: 'NONE', message: 'Printing is disabled in Settings' };
  }
  if (type === 'NETWORK') {
    if (!settings.printerIp) throw new Error('Printer IP address is not configured');
    return printNetwork(payload, settings.printerIp, settings.printerPort || 9100);
  }
  if (type === 'USB') return printUsb(payload);
  throw new Error(`Unsupported printer type: ${type}`);
}

async function printReceipt(sale, settings, opts = {}) {
  const text = buildReceiptText(sale, settings, opts);
  const result = await sendToPrinter(toEscPos(text), settings);
  return { ...result, text };
}

async function printTest(settings) {
  const w = widthChars(settings.paperWidth);
  let text = '';
  text += center('TEST RECEIPT', w) + '\n';
  text += center('Printer connection successful.', w) + '\n';
  text += center(settings.businessName || 'Market POS', w);
  text += '\n' + center(formatDate(new Date()), w);
  const result = await sendToPrinter(toEscPos(text, { center: true }), settings);
  return { ...result, text };
}

async function status(settings) {
  const type = (settings.printerType || 'NONE').toUpperCase();
  if (type === 'NETWORK' && settings.printerIp) {
    const reachable = await new Promise((resolve) => {
      const s = new net.Socket();
      s.setTimeout(1500);
      s.once('error', () => resolve(false));
      s.once('timeout', () => {
        s.destroy();
        resolve(false);
      });
      s.connect(settings.printerPort || 9100, settings.printerIp, () => {
        s.end();
        resolve(true);
      });
    });
    return { connected: reachable, type: 'ESC/POS', connection: 'NETWORK', paperWidth: settings.paperWidth };
  }
  if (type === 'USB') {
    let connected = false;
    try {
      const usb = require('escpos-usb');
      connected = usb.findPrinter().length > 0;
    } catch (e) {
      connected = false;
    }
    return { connected, type: 'ESC/POS', connection: 'USB', paperWidth: settings.paperWidth };
  }
  return { connected: false, type: 'ESC/POS', connection: type, paperWidth: settings.paperWidth };
}

module.exports = { printReceipt, printTest, status, buildReceiptText, CMD };
