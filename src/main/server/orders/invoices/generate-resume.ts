import PDFDocument from 'pdfkit'
import type { Client } from '../../../../shared/schemas/client.schema'
import { shapeArabicLine } from './arabic-text'
import { LedgerEntry } from '../../ledgers/types'

/**
 * Renders a standalone client account statement (single ledger entry
 * "resume") as a PDF Buffer — no order/item table.
 *
 * Layout: title, then a compact date line, then a side-by-side row
 * (summary box on the left, client info on the right — RTL reading
 * order, client info read first). All vertical spacing is driven by
 * explicit y increments rather than doc.moveDown(), since moveDown()
 * scales with the *current* font size and produced uneven gaps when
 * jumping between the 18pt title and 10pt body text.
 */

const PAGE_MARGIN = 50
const FOOTER_RESERVE = 20
const COLUMN_GAP = 20

const ARABIC_FONT = 'Arabic'

const referenceTypeLabels: Record<LedgerEntry['referenceType'], string> = {
  order: 'قيمة الطلب',
  payment: 'المبلغ المدفوع'
}

function disableAutoPageBreak(doc: PDFKit.PDFDocument): void {
  doc.page.margins.bottom = 0
}

export function generateClientResumeStatementPdf(
  client: Client,
  resumeBalance: LedgerEntry,
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

    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const pageRight = doc.page.width - doc.page.margins.right
    const pageLeft = doc.page.margins.left
    const bottomLimit = doc.page.height - PAGE_MARGIN - FOOTER_RESERVE
    const fullWidth = pageRight - pageLeft

    function startContinuationPage(): number {
      doc.addPage()
      disableAutoPageBreak(doc)
      doc.font(ARABIC_FONT)
      return doc.page.margins.top
    }

    // ---- Title + date (explicit, tight spacing) ---------------------------

    let y = doc.page.margins.top
    doc.fontSize(18)
    doc.text(shapeArabicLine('كشف حساب'), pageLeft, y, { width: fullWidth, align: 'right' })
    y += 26 // title line height + small gap, independent of body font size

    const entryDate = new Date(resumeBalance.createdAt)
    const formattedDate = `${entryDate.getFullYear()}/${String(entryDate.getMonth() + 1).padStart(2, '0')}/${String(entryDate.getDate()).padStart(2, '0')}`

    doc.fontSize(10)
    doc.text(shapeArabicLine('التاريخ'), pageLeft + fullWidth - 100, y, {
      width: 100,
      align: 'right'
    })
    doc.text(formattedDate, pageLeft, y, { width: fullWidth - 106, align: 'right' })
    y += 20

    // ---- Side-by-side row: summary box (left) | client info (right) -------

    const SUMMARY_BOX_WIDTH = 220
    const SUMMARY_VALUE_COL_WIDTH = 85
    const SUMMARY_LABEL_COL_WIDTH = SUMMARY_BOX_WIDTH - SUMMARY_VALUE_COL_WIDTH
    const SUMMARY_ROW_HEIGHT = 16
    const SUMMARY_TITLE_HEIGHT = 16
    const SUMMARY_PADDING_TOP = 6
    const SUMMARY_PADDING_BOTTOM = 6
    const summaryBoxHeight =
      SUMMARY_PADDING_TOP + SUMMARY_TITLE_HEIGHT + SUMMARY_ROW_HEIGHT * 3 + SUMMARY_PADDING_BOTTOM

    const clientColX = pageLeft + SUMMARY_BOX_WIDTH + COLUMN_GAP
    const clientColWidth = fullWidth - SUMMARY_BOX_WIDTH - COLUMN_GAP

    const CLIENT_INFO_TITLE_HEIGHT = 16
    const CLIENT_INFO_LINE_HEIGHT = 14
    const clientInfoHeight =
      CLIENT_INFO_TITLE_HEIGHT + CLIENT_INFO_LINE_HEIGHT * (client.phone ? 2 : 1)

    const rowHeight = Math.max(summaryBoxHeight, clientInfoHeight)

    if (y + rowHeight > bottomLimit) {
      y = startContinuationPage()
    }

    // -- Summary box (left) --

    doc.rect(pageLeft, y, SUMMARY_BOX_WIDTH, summaryBoxHeight).lineWidth(1).stroke()

    let summaryY = y + SUMMARY_PADDING_TOP
    doc.fontSize(10)
    doc.text(shapeArabicLine('ملخص الحساب'), pageLeft, summaryY, {
      width: SUMMARY_BOX_WIDTH - 6,
      align: 'right'
    })
    summaryY += SUMMARY_TITLE_HEIGHT

    const summaryRows: Array<[string, string]> = [
      ['الرصيد السابق', resumeBalance.balanceBefore.toFixed(2)],
      [referenceTypeLabels[resumeBalance.referenceType], resumeBalance.amount.toFixed(2)],
      ['الرصيد الحالي', resumeBalance.balanceAfter.toFixed(2)]
    ]

    doc.fontSize(9)
    for (const [label, value] of summaryRows) {
      doc.text(shapeArabicLine(label), pageLeft + SUMMARY_VALUE_COL_WIDTH, summaryY, {
        width: SUMMARY_LABEL_COL_WIDTH - 6,
        align: 'right'
      })
      // Numeric — deliberately not passed through shapeArabicLine.
      doc.text(value, pageLeft, summaryY, {
        width: SUMMARY_VALUE_COL_WIDTH - 6,
        align: 'right'
      })
      summaryY += SUMMARY_ROW_HEIGHT
    }

    // -- Client info (right) --

    let clientY = y
    doc.fontSize(12)
    doc.text(shapeArabicLine('بيانات العميل:'), clientColX, clientY, {
      width: clientColWidth,
      align: 'right'
    })
    clientY += CLIENT_INFO_TITLE_HEIGHT

    doc.fontSize(11)
    doc.text(shapeArabicLine(client.name), clientColX, clientY, {
      width: clientColWidth,
      align: 'right'
    })
    clientY += CLIENT_INFO_LINE_HEIGHT

    if (client.phone) {
      doc.text(shapeArabicLine(client.phone), clientColX, clientY, {
        width: clientColWidth,
        align: 'right'
      })
    }

    doc.end()
  })
}
