import PDFDocument from 'pdfkit'
import type { Order } from '../../../../shared/schemas/order.schema'
import type { Client } from '../../../../shared/schemas/client.schema'
import { shapeArabicLine, wrapAndShapeArabic } from './arabic-text'

/**
 * Renders a printable invoice PDF and returns it as a Buffer.
 *
 * --- Arabic / RTL ---
 * pdfkit has no native Arabic or RTL support (see arabic-text.ts for the
 * shaping/bidi pipeline this relies on). The layout itself is mirrored
 * for RTL reading too: the item table reads right to left (Product
 * column anchored at the right margin, Line Total at the left margin),
 * and page numbers sit at the bottom-left.
 *
 * --- Payment is not part of the order ---
 * The order row itself carries no payment fields at all. `depositAmount`
 * is passed in separately, already looked up by the caller
 * (OrdersService/PaymentsService, correlated by matching timestamps, not
 * a stored relation — see PaymentsDataAccess.findByClientAtTimestamp).
 * This function only ever *displays* that number; it never writes
 * anything.
 *
 * --- Pagination ---
 * Every row's height is measured before drawing (via wrapAndShapeArabic's
 * line count — Arabic word-wrapping has to happen before shaping, see
 * arabic-text.ts), the table header re-draws on continuation pages, and
 * the order-summary box is kept as one indivisible block.
 *
 * IMPORTANT: pdfkit has its OWN internal auto-pagination on top of this
 * manual one — when a doc.text() call would draw past
 * `page.height - margins.bottom`, pdfkit silently inserts a page of its
 * own, independent of the `bottomLimit` checks below. That produces
 * blank/duplicate pages on long orders once our own rowHeight estimate
 * and pdfkit's internal check disagree. We neutralize pdfkit's own
 * check via `disableAutoPageBreak()` and treat `bottomLimit` as the
 * single source of truth for when to break. This must be re-applied
 * after every `doc.addPage()`, since addPage() resets margins from the
 * original constructor options.
 */

// ---- Layout constants -----------------------------------------------------

const PAGE_MARGIN = 50
const FOOTER_RESERVE = 20
const COLUMN_GAP = 10

const ROW_PADDING_Y = 6
const ROW_MIN_HEIGHT = 18
const HEADER_ROW_HEIGHT = 22

const ARABIC_FONT = 'Arabic'

/**
 * Neutralizes pdfkit's internal auto-page-break check by zeroing its
 * notion of the bottom margin (`maxY()` becomes `page.height`, so it
 * never decides on its own that a doc.text() call needs a new page).
 * Our own `bottomLimit`/`FOOTER_RESERVE` logic remains the only thing
 * that triggers `doc.addPage()`. Must be called once up front AND again
 * after every `doc.addPage()`, since addPage() re-reads the original
 * margins from the constructor options.
 */
function disableAutoPageBreak(doc: PDFKit.PDFDocument): void {
  doc.page.margins.bottom = 0
}

export function generateInvoicePdf(
  order: Order,
  client: Client,
  depositAmount: number,
  arabicFontPath: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      bufferPages: true
    })

    doc.registerFont(ARABIC_FONT, arabicFontPath)
    doc.font(ARABIC_FONT)
    disableAutoPageBreak(doc)

    // Measured from the actual font/lineGap rather than a hardcoded guess —
    // matters more here since we're relying on rowHeight to be accurate now
    // that pdfkit's own safety-net page-break is disabled.
    const LINE_HEIGHT = doc.currentLineHeight(true)

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageRight = doc.page.width - doc.page.margins.right
    const pageLeft = doc.page.margins.left
    const bottomLimit = doc.page.height - PAGE_MARGIN - FOOTER_RESERVE
    const fullWidth = pageRight - pageLeft

    // Mirrored column layout, right to left: Product is the rightmost
    // (first-read) column; Line Total is the leftmost (last-read) one.
    const COL = {
      product: { x: 0, width: 235 },
      qty: { x: 0, width: 50 },
      unit: { x: 0, width: 90 },
      total: { x: 0, width: 90 }
    }
    COL.product.x = pageRight - COL.product.width
    COL.qty.x = COL.product.x - COLUMN_GAP - COL.qty.width
    COL.unit.x = COL.qty.x - COLUMN_GAP - COL.unit.width
    COL.total.x = COL.unit.x - COLUMN_GAP - COL.total.width

    const measureWidth = (text: string) => doc.widthOfString(text)

    /** Draws the column header row (Product | Qty | Unit Price | Line Total, right to left). */
    function drawTableHeader(y: number): number {
      doc.fontSize(11)
      doc.text(shapeArabicLine('المنتج'), COL.product.x, y, {
        width: COL.product.width,
        align: 'right'
      })
      doc.text(shapeArabicLine('الكمية'), COL.qty.x, y, { width: COL.qty.width, align: 'right' })
      doc.text(shapeArabicLine('سعر الوحدة'), COL.unit.x, y, {
        width: COL.unit.width,
        align: 'right'
      })
      doc.text(shapeArabicLine('الإجمالي'), COL.total.x, y, {
        width: COL.total.width,
        align: 'right'
      })

      const ruleY = y + HEADER_ROW_HEIGHT - 6
      doc.moveTo(COL.total.x, ruleY).lineTo(pageRight, ruleY).lineWidth(1).stroke()

      doc.fontSize(10)
      return ruleY + 8
    }

    /** Wraps + shapes the product name and returns its visual lines plus the row height they need. */
    function layoutProductName(name: string): { lines: string[]; height: number } {
      doc.fontSize(10)
      const lines = wrapAndShapeArabic(measureWidth, name, COL.product.width)
      const height = Math.max(ROW_MIN_HEIGHT, lines.length * LINE_HEIGHT + ROW_PADDING_Y)
      return { lines, height }
    }

    function startItemContinuationPage(): number {
      doc.addPage()
      disableAutoPageBreak(doc)
      doc.font(ARABIC_FONT)
      return drawTableHeader(doc.page.margins.top)
    }

    function drawInvoiceInfo(y: number): number {
      const INFO_LABEL_WIDTH = 120
      const INFO_VALUE_WIDTH = fullWidth - INFO_LABEL_WIDTH
      const INFO_ROW_HEIGHT = 24
      let currentY = y
      doc.fontSize(20)
      doc.text(shapeArabicLine('رقم الفاتورة'), pageLeft + INFO_VALUE_WIDTH, currentY, {
        width: INFO_LABEL_WIDTH,
        align: 'right'
      })
      doc.text(order.invoiceNumber.toString().slice(0, 10), pageLeft, currentY, {
        width: INFO_VALUE_WIDTH,
        align: 'right'
      })
      currentY += INFO_ROW_HEIGHT
      const orderDate = new Date(order.orderDate)
      const formattedDate = `${orderDate.getFullYear()}/${String(orderDate.getMonth() + 1).padStart(2, '0')}/${String(orderDate.getDate()).padStart(2, '0')}`
      doc.fontSize(10)
      doc.text(shapeArabicLine('التاريخ'), pageLeft + INFO_VALUE_WIDTH, currentY, {
        width: INFO_LABEL_WIDTH,
        align: 'right'
      })
      doc.text(formattedDate, pageLeft, currentY, { width: INFO_VALUE_WIDTH, align: 'right' })
      return currentY + INFO_ROW_HEIGHT
    }

    function startPlainContinuationPage(): number {
      doc.addPage()
      disableAutoPageBreak(doc)
      doc.font(ARABIC_FONT)
      const top = doc.page.margins.top
      doc.fontSize(9).fillColor('#666666')

      // doc.text(shapeArabicLine(`فاتورة رقم`), pageLeft, top, {
      //   width: fullWidth / 3,
      //   align: 'right'
      // })
      // doc.text(shapeArabicLine(`${order.invoiceNumber.toString().slice(0, 10)})`), pageLeft, top, {
      //   width: (2 * fullWidth) / 3,
      //   align: 'right'
      // })
      doc.fillColor('black').fontSize(10)
      return top + 18
    }

    // ---- Header (page 1 only) ---------------------------------------------

    doc.y = drawInvoiceInfo(doc.y)
    doc.moveDown()

    doc.fontSize(12)
    doc.text(shapeArabicLine('بيانات العميل:'), pageLeft, doc.y, {
      width: fullWidth,
      align: 'right'
    })
    doc.fontSize(11)
    doc.text(shapeArabicLine(client.name), pageLeft, doc.y, { width: fullWidth, align: 'right' })
    if (client.phone)
      doc.text(shapeArabicLine(client.phone), pageLeft, doc.y, { width: fullWidth, align: 'right' })

    doc.moveDown()

    // ---- Item table (page-break-aware, RTL column order) -------------------
    // Columns: Product name | Quantity | Unit price | Quantity × Unit price

    let y = drawTableHeader(doc.y)

    for (const item of order.items) {
      const { lines, height: rowHeight } = layoutProductName(item.productNameSnapshot)

      if (y + rowHeight > bottomLimit) {
        y = startItemContinuationPage()
      }

      doc.fontSize(10)
      lines.forEach((line, i) => {
        doc.text(line, COL.product.x, y + i * LINE_HEIGHT, {
          width: COL.product.width,
          align: 'right'
        })
      })
      doc.text(String(item.quantity), COL.qty.x, y, { width: COL.qty.width, align: 'right' })
      doc.text(item.unitPrice.toFixed(2), COL.unit.x, y, { width: COL.unit.width, align: 'right' })
      doc.text(item.lineTotal.toFixed(2), COL.total.x, y, {
        width: COL.total.width,
        align: 'right'
      })

      y += rowHeight
    }

    doc.moveTo(COL.total.x, y).lineTo(pageRight, y).lineWidth(1).stroke()
    y += 20

    // ---- Order summary box: total / deposited / remaining ------------------
    // Bottom-left, as requested — a small bordered box with three rows:
    // the order's total, how much the client deposited when the order was
    // created (looked up by timestamp, entirely separate from the order
    // row itself), and what's left to pay on this order specifically.
    // This is scoped to *this order* — not the client's overall account
    // balance, which can differ (see the client detail page for that).

    const SUMMARY_BOX_WIDTH = 230
    const SUMMARY_VALUE_COL_WIDTH = 90
    const SUMMARY_LABEL_COL_WIDTH = SUMMARY_BOX_WIDTH - SUMMARY_VALUE_COL_WIDTH
    const SUMMARY_ROW_HEIGHT = 20
    const SUMMARY_TITLE_HEIGHT = 20
    const SUMMARY_PADDING = 10
    const summaryBoxHeight = SUMMARY_TITLE_HEIGHT + SUMMARY_ROW_HEIGHT * 3 + SUMMARY_PADDING

    if (y + summaryBoxHeight > bottomLimit) {
      y = startPlainContinuationPage()
    }

    const summaryBoxX = pageLeft
    const summaryValueX = summaryBoxX
    const summaryLabelX = summaryBoxX + SUMMARY_VALUE_COL_WIDTH

    doc.rect(summaryBoxX, y, SUMMARY_BOX_WIDTH, summaryBoxHeight).lineWidth(1).stroke()

    let summaryY = y + SUMMARY_PADDING / 2
    doc.fontSize(10)
    doc.text(shapeArabicLine('ملخص الطلب'), summaryBoxX, summaryY, {
      width: SUMMARY_BOX_WIDTH,
      align: 'right'
    })
    summaryY += SUMMARY_TITLE_HEIGHT

    const remaining = client.debt
    const summaryRows: Array<[string, string]> = [
      ['الإجمالي', order.subtotal.toFixed(2)],
      ['المبلغ المدفوع', depositAmount.toFixed(2)],
      ['الدين المتبقي', remaining.toFixed(2)]
    ]

    doc.fontSize(9)
    for (const [label, value] of summaryRows) {
      doc.text(shapeArabicLine(label), summaryLabelX, summaryY, {
        width: SUMMARY_LABEL_COL_WIDTH - 6,
        align: 'right'
      })
      // Pure numeric string — deliberately not passed through
      // shapeArabicLine, same as the item table's numeric columns.
      doc.text(value, summaryValueX, summaryY, {
        width: SUMMARY_VALUE_COL_WIDTH - 6,
        align: 'right'
      })
      summaryY += SUMMARY_ROW_HEIGHT
    }

    y += summaryBoxHeight

    // ---- Page numbers (mirrored to bottom-left for RTL) --------------------

    const pageRange = doc.bufferedPageRange()
    for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
      doc.switchToPage(i)
      const label = shapeArabicLine(`صفحة ${i - pageRange.start + 1} من ${pageRange.count}`)
      doc.fontSize(8).fillColor('#888888')
      doc.text(label, pageLeft, doc.page.height - PAGE_MARGIN + 5, {
        width: fullWidth,
        align: 'left'
      })
      doc.fillColor('black')
    }

    doc.end()
  })
}
