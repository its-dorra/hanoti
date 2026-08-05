import PDFDocument from 'pdfkit'
import type { Order } from '../../../../shared/schemas/order.schema'
import type { Client } from '../../../../shared/schemas/client.schema'
import { shapeArabicLine, wrapAndShapeArabic } from './arabic-text'
import { LedgerEntry } from '../../ledgers/types'

const PAGE_MARGIN = 20
const FOOTER_RESERVE = 15
const COLUMN_GAP = 6

const ROW_PADDING_Y = 5
const ROW_MIN_HEIGHT = 20
const HEADER_ROW_HEIGHT = 24

const ARABIC_FONT = 'Arabic'

function disableAutoPageBreak(doc: PDFKit.PDFDocument): void {
  doc.page.margins.bottom = 0
}

export function generateInvoicePdf(
  order: Order,
  client: Client,
  arabicFontPath: string,
  resumeBalance?: LedgerEntry
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A5',
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
      product: { x: 0, width: 165 },
      qty: { x: 0, width: 40 },
      unit: { x: 0, width: 68 },
      total: { x: 0, width: 88 }
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
      const INFO_LABEL_WIDTH = 90
      const INFO_VALUE_WIDTH = fullWidth - INFO_LABEL_WIDTH
      const INFO_ROW_HEIGHT = 20
      let currentY = y
      doc.fontSize(20)
      doc.text(shapeArabicLine('رقم الفاتورة'), pageLeft + INFO_VALUE_WIDTH, currentY, {
        width: INFO_LABEL_WIDTH,
        align: 'right'
      })
      doc.text(order.id.toString().slice(0, 10), pageLeft, currentY, {
        width: INFO_VALUE_WIDTH,
        align: 'right'
      })
      currentY += INFO_ROW_HEIGHT + 10
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

    if (resumeBalance) {
      const SUMMARY_BOX_WIDTH = 170
      const SUMMARY_VALUE_COL_WIDTH = 70
      const SUMMARY_LABEL_COL_WIDTH = 100
      const SUMMARY_ROW_HEIGHT = 20
      const SUMMARY_TITLE_HEIGHT = 20
      const SUMMARY_PADDING = 10
      const summaryBoxHeight = SUMMARY_TITLE_HEIGHT + SUMMARY_ROW_HEIGHT * 4 + SUMMARY_PADDING

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
        width: SUMMARY_BOX_WIDTH - 6,
        align: 'right'
      })
      summaryY += SUMMARY_TITLE_HEIGHT

      const summaryRows: Array<[string, string]> = [
        ['الإجمالي', order.subtotal.toFixed(2)],
        ['الديون السابقة', resumeBalance.balanceBefore.toFixed(2)],
        ['المبلغ المدفوع', resumeBalance.amount.toFixed(2)],
        ['الدين المتبقي', resumeBalance.balanceAfter.toFixed(2)]
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
    } else {
      const SUMMARY_BOX_WIDTH = 170
      const SUMMARY_VALUE_COL_WIDTH = 70
      const SUMMARY_LABEL_COL_WIDTH = 100
      const SUMMARY_ROW_HEIGHT = 20
      const SUMMARY_TITLE_HEIGHT = 20
      const SUMMARY_PADDING = 10
      const summaryBoxHeight = SUMMARY_TITLE_HEIGHT + SUMMARY_ROW_HEIGHT + SUMMARY_PADDING

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
        width: SUMMARY_BOX_WIDTH - 6,
        align: 'right'
      })
      summaryY += SUMMARY_TITLE_HEIGHT

      const summaryRows: Array<[string, string]> = [['الإجمالي', order.subtotal.toFixed(2)]]

      doc.fontSize(9)
      for (const [label, value] of summaryRows) {
        doc.text(shapeArabicLine(label), summaryLabelX, summaryY, {
          width: SUMMARY_LABEL_COL_WIDTH - 6,
          align: 'right'
        })

        doc.text(value, summaryValueX, summaryY, {
          width: SUMMARY_VALUE_COL_WIDTH - 6,
          align: 'right'
        })
        summaryY += SUMMARY_ROW_HEIGHT
      }

      y += summaryBoxHeight
    }

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
