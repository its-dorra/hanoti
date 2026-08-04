import { orpc } from '@renderer/integrations/orpc'

export async function printInvoice(orderId: number, resumeDate: Date | undefined) {
  const { base64 } = await orpc.ledgers.getInvoicePdf.call({ orderId, resumeDate })
  await window.api.openPdf({
    base64,
    filename: `invoice-${orderId}.pdf`
  })
}

export async function printResume(clientId: number, resumeDate: Date) {
  const { base64 } = await orpc.ledgers.getResumePdf.call({ clientId, resumeDate })
  await window.api.openPdf({
    base64,
    filename: `resume-${clientId}-${resumeDate.toISOString().split('T')[0]}.pdf`
  })
}
