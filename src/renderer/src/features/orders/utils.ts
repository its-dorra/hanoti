import { orpc } from '@renderer/integrations/orpc'

export async function printInvoice(orderId: number,invoiceNumber: number) {
  const { base64 } = await orpc.orders.getInvoicePdf.call({ orderId })
  await window.api.openPdf({
    base64,
    filename: `invoice-${invoiceNumber}.pdf`
  })
}
