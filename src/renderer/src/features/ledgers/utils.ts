import { orpc } from '@renderer/integrations/orpc'

export async function printInvoice(orderId: number, resumeDate: Date | undefined) {
  const { base64 } = await orpc.ledgers.getInvoicePdf.call({ orderId, resumeDate })
  await window.api.openPdf({
    base64,
    filename: `invoice-${orderId}.pdf`
  })
}
