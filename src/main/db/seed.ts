// seed.ts

import { sql } from 'drizzle-orm'
import { db as initilizer } from './index'
import {
  clients,
  products,
  productPrices,
  orders,
  orderItems,
  payments,
  debtEntries,
  debtTransactions
} from './schema'

const db = initilizer()
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date()

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const clientData = [
  {
    name: 'محمد بن عيسى',
    phone: '0550123456',
    notes: 'زبون دائم',
    debt: 0
  },
  {
    name: 'عبد القادر بوشامة',
    phone: '0661234567',
    notes: 'يفضل الدفع آخر الشهر',
    debt: 0
  },
  {
    name: 'أحمد قاسمي',
    phone: '0770987654',
    notes: 'محل مواد غذائية',
    debt: 0
  },
  {
    name: 'يوسف رحماني',
    phone: '0555678901',
    notes: null,
    debt: 0
  },
  {
    name: 'علي بن عمر',
    phone: '0662345678',
    notes: 'زبون بالجملة',
    debt: 0
  },
  {
    name: 'سليم لعروسي',
    phone: '0773456789',
    notes: 'الدفع نقداً غالباً',
    debt: 0
  },
  {
    name: 'مراد بوعلام',
    phone: '0556789012',
    notes: 'لديه حساب مفتوح',
    debt: 0
  },
  {
    name: 'كريم شريف',
    phone: '0667890123',
    notes: null,
    debt: 0
  },
  {
    name: 'نبيل حمدي',
    phone: '0778901234',
    notes: 'زبون قديم',
    debt: 0
  },
  {
    name: 'رضا منصوري',
    phone: '0559012345',
    notes: 'محل بقالة',
    debt: 0
  },
  {
    name: 'سمير قريشي',
    phone: '0660123456',
    notes: null,
    debt: 0
  },
  {
    name: 'فارس بوزيد',
    phone: '0771234567',
    notes: 'يشتري بالجملة',
    debt: 0
  },
  {
    name: 'حسين دريسي',
    phone: '0552345678',
    notes: null,
    debt: 0
  },
  {
    name: 'طارق بن صالح',
    phone: '0663456789',
    notes: 'زبون منتظم',
    debt: 0
  },
  {
    name: 'إبراهيم شريف',
    phone: '0774567890',
    notes: 'دفع جزئي',
    debt: 0
  },
  {
    name: 'مصطفى عياد',
    phone: '0557890123',
    notes: null,
    debt: 0
  },
  {
    name: 'بلال مرزوق',
    phone: '0668901234',
    notes: 'محل مواد غذائية',
    debt: 0
  },
  {
    name: 'حمزة قادري',
    phone: '0779012345',
    notes: null,
    debt: 0
  },
  {
    name: 'مالك بوشارب',
    phone: '0550123987',
    notes: 'زبون بالجملة',
    debt: 0
  },
  {
    name: 'أيمن بن داود',
    phone: '0661234987',
    notes: null,
    debt: 0
  },
  {
    name: 'زين الدين مرابط',
    phone: '0772345098',
    notes: 'الدفع نهاية الأسبوع',
    debt: 0
  },
  {
    name: 'عبد الرحمن شعلال',
    phone: '0553456109',
    notes: null,
    debt: 0
  },
  {
    name: 'منير بختي',
    phone: '0664567210',
    notes: 'زبون دائم',
    debt: 0
  },
  {
    name: 'وليد عيساوي',
    phone: '0775678321',
    notes: null,
    debt: 0
  },
  {
    name: 'شمس الدين زروقي',
    phone: '0556789432',
    notes: 'محل بقالة',
    debt: 0
  },
  {
    name: 'جمال بوعبد الله',
    phone: '0667890543',
    notes: null,
    debt: 0
  },
  {
    name: 'رشيد طواهرية',
    phone: '0778901654',
    notes: 'زبون بالجملة',
    debt: 0
  },
  {
    name: 'سفيان قاسمي',
    phone: '0559012765',
    notes: null,
    debt: 0
  },
  {
    name: 'عمر بن عيسى',
    phone: '0660123876',
    notes: 'زبون قديم',
    debt: 0
  },
  {
    name: 'ياسين بومدين',
    phone: '0771234987',
    notes: null,
    debt: 0
  }
]

const productData = [
  { name: 'زيت المائدة 5 لتر', buyingPrice: 650, quantity: 85 },
  { name: 'زيت المائدة 2 لتر', buyingPrice: 290, quantity: 120 },
  { name: 'سكر أبيض 1 كغ', buyingPrice: 105, quantity: 250 },
  { name: 'سكر أبيض 5 كغ', buyingPrice: 510, quantity: 80 },
  { name: 'فرينة 1 كغ', buyingPrice: 65, quantity: 180 },
  { name: 'فرينة 5 كغ', buyingPrice: 320, quantity: 95 },
  { name: 'سميد رقيق 5 كغ', buyingPrice: 270, quantity: 100 },
  { name: 'سميد متوسط 5 كغ', buyingPrice: 265, quantity: 90 },
  { name: 'أرز طويل الحبة 1 كغ', buyingPrice: 150, quantity: 75 },
  { name: 'عدس 1 كغ', buyingPrice: 180, quantity: 60 },
  { name: 'حمص 1 كغ', buyingPrice: 240, quantity: 55 },
  { name: 'فاصولياء بيضاء 1 كغ', buyingPrice: 280, quantity: 45 },
  { name: 'مقرونة 500 غ', buyingPrice: 75, quantity: 160 },
  { name: 'كسكس 1 كغ', buyingPrice: 120, quantity: 110 },
  { name: 'طماطم مصبرة 400 غ', buyingPrice: 95, quantity: 130 },
  { name: 'هريسة حارة 135 غ', buyingPrice: 45, quantity: 90 },
  { name: 'حليب مجفف 500 غ', buyingPrice: 420, quantity: 40 },
  { name: 'قهوة مطحونة 250 غ', buyingPrice: 260, quantity: 65 },
  { name: 'شاي أخضر 100 كيس', buyingPrice: 180, quantity: 50 },
  { name: 'ماء معدني 1.5 لتر', buyingPrice: 35, quantity: 300 },
  { name: 'ماء معدني 5 لتر', buyingPrice: 80, quantity: 120 },
  { name: 'مشروب غازي 1 لتر', buyingPrice: 90, quantity: 150 },
  { name: 'عصير برتقال 1 لتر', buyingPrice: 130, quantity: 100 },
  { name: 'بسكويت بالشوكولاتة', buyingPrice: 55, quantity: 140 },
  { name: 'بسكويت بالزبدة', buyingPrice: 60, quantity: 100 },
  { name: 'شوكولاتة بالحليب', buyingPrice: 110, quantity: 80 },
  { name: 'حلوى فواكه مشكلة', buyingPrice: 75, quantity: 90 },
  { name: 'مناديل ورقية', buyingPrice: 95, quantity: 70 },
  { name: 'مسحوق غسيل 2 كغ', buyingPrice: 480, quantity: 55 },
  { name: 'سائل تنظيف الأرضيات 1 لتر', buyingPrice: 180, quantity: 75 },
  { name: 'سائل غسل الأواني 750 مل', buyingPrice: 140, quantity: 90 },
  { name: 'صابون اليدين', buyingPrice: 90, quantity: 100 },
  { name: 'شامبو 400 مل', buyingPrice: 350, quantity: 45 },
  { name: 'معجون أسنان', buyingPrice: 180, quantity: 85 },
  { name: 'فرشاة أسنان', buyingPrice: 100, quantity: 70 },
  { name: 'بطاريات AA', buyingPrice: 150, quantity: 60 },
  { name: 'مصباح LED', buyingPrice: 250, quantity: 35 },
  { name: 'أكياس قمامة كبيرة', buyingPrice: 120, quantity: 90 },
  { name: 'مناديل مبللة', buyingPrice: 130, quantity: 75 },
  { name: 'بيض 30 حبة', buyingPrice: 520, quantity: 50 }
]

const debtClientNames = [
  'محمود بن عيسى',
  'عبد الوهاب قريشي',
  'مراد بوعلام',
  'سعيد بن عمر',
  'أحمد لعروسي',
  'كمال بوزيد',
  'يوسف دريسي',
  'عادل منصوري',
  'محل النجاح',
  'بقالة البركة',
  'مخزن الأمان',
  'تاجر الجملة'
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log('🌱 بدء تعبئة قاعدة البيانات...')

  await db.transaction(async (tx) => {
    // ---------------------------------------------------------
    // 1. Clients
    // ---------------------------------------------------------

    console.log('👥 إضافة الزبائن...')

    const insertedClients = await tx
      .insert(clients)
      .values(
        clientData.map((client) => ({
          ...client,
          createdAt: daysAgo(randomInt(10, 300)),
          updatedAt: now
        }))
      )
      .returning()

    // ---------------------------------------------------------
    // 2. Products
    // ---------------------------------------------------------

    console.log('📦 إضافة المنتجات...')

    const insertedProducts = await tx
      .insert(products)
      .values(
        productData.map((product) => ({
          ...product,
          createdAt: daysAgo(randomInt(5, 180)),
          updatedAt: now
        }))
      )
      .returning()

    // ---------------------------------------------------------
    // 3. Product prices
    // ---------------------------------------------------------

    console.log('💰 إضافة أسعار البيع...')

    const prices = insertedProducts.flatMap((product) => {
      const basePrice = product.buyingPrice

      return [
        {
          productId: product.id,
          amount: Number((basePrice * 1.15).toFixed(2))
        },
        {
          productId: product.id,
          amount: Number((basePrice * 1.2).toFixed(2))
        },
        {
          productId: product.id,
          amount: Number((basePrice * 1.3).toFixed(2))
        }
      ]
    })

    const insertedPrices = await tx.insert(productPrices).values(prices).returning()

    // ---------------------------------------------------------
    // 4. Orders and order items
    // ---------------------------------------------------------

    console.log('🧾 إضافة الطلبات...')

    let invoiceNumber = 1001

    const orderCount = 80

    for (let i = 0; i < orderCount; i++) {
      const client = randomItem(insertedClients)

      const orderDate = daysAgo(randomInt(0, 120))

      const selectedProducts = [...insertedProducts]
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(1, 6))

      const items = selectedProducts.map((product) => {
        const productPriceOptions = insertedPrices.filter((price) => price.productId === product.id)

        const selectedPrice = randomItem(productPriceOptions)

        const quantity = randomInt(1, 8)

        return {
          productId: product.id,
          productNameSnapshot: product.name,
          quantity,
          unitPrice: selectedPrice.amount,
          lineTotal: Number((quantity * selectedPrice.amount).toFixed(2))
        }
      })

      const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2))

      const [order] = await tx
        .insert(orders)
        .values({
          invoiceNumber: invoiceNumber++,
          clientId: client.id,
          orderDate,
          status: Math.random() < 0.08 ? 'cancelled' : 'open',
          subtotal,
          createdAt: orderDate,
          updatedAt: orderDate
        })
        .returning()

      await tx.insert(orderItems).values(
        items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }))
      )
    }

    // ---------------------------------------------------------
    // 5. Payments
    // ---------------------------------------------------------

    console.log('💳 إضافة المدفوعات...')

    const paymentNotes = [
      'دفع نقدي',
      'تسديد جزء من الدين',
      'دفع عند الاستلام',
      'تسديد الحساب',
      'دفعة نقدية',
      'دفع بواسطة تحويل'
    ]

    for (const client of insertedClients) {
      // Some clients have no payments.
      if (Math.random() < 0.25) continue

      const paymentCount = randomInt(1, 4)

      for (let i = 0; i < paymentCount; i++) {
        await tx.insert(payments).values({
          clientId: client.id,
          amount: randomFloat(500, 15000),
          paymentDate: daysAgo(randomInt(0, 90)),
          note: randomItem(paymentNotes),
          createdAt: now
        })
      }
    }

    // ---------------------------------------------------------
    // 6. Recalculate client debt
    // ---------------------------------------------------------

    console.log('📊 حساب ديون الزبائن...')

    for (const client of insertedClients) {
      const clientOrders = await tx
        .select({
          subtotal: orders.subtotal
        })
        .from(orders)
        .where(sql`${orders.clientId} = ${client.id} AND ${orders.status} = 'open'`)

      const clientPayments = await tx
        .select({
          amount: payments.amount
        })
        .from(payments)
        .where(sql`${payments.clientId} = ${client.id}`)

      const totalOrders = clientOrders.reduce((sum, order) => sum + order.subtotal, 0)

      const totalPayments = clientPayments.reduce((sum, payment) => sum + payment.amount, 0)

      const debt = Math.max(0, Number((totalOrders - totalPayments).toFixed(2)))

      await tx
        .update(clients)
        .set({
          debt,
          updatedAt: now
        })
        .where(sql`${clients.id} = ${client.id}`)
    }

    // ---------------------------------------------------------
    // 7. Isolated debt notebook entries
    // ---------------------------------------------------------

    console.log('📒 إضافة دفتر الديون المستقل...')

    const insertedDebtEntries = await tx
      .insert(debtEntries)
      .values(
        debtClientNames.map((clientName, index) => ({
          clientName,
          type: index % 4 === 0 ? 'seller' : 'buyer',
          debt: 0,
          createdAt: daysAgo(randomInt(1, 180))
        }))
      )
      .returning()

    // ---------------------------------------------------------
    // 8. Debt transactions
    // ---------------------------------------------------------

    console.log('💸 إضافة معاملات الديون...')

    const depositNotes = [
      'تسديد جزء من الدين',
      'دفع نقدي',
      'تسديد الحساب',
      'دفعة أولى',
      'دفعة جزئية'
    ]

    const chargeNotes = [
      'شراء بضاعة',
      'شراء مواد غذائية',
      'فاتورة جديدة',
      'شراء بالجملة',
      'إضافة إلى الحساب'
    ]

    for (const entry of insertedDebtEntries) {
      let currentDebt = 0

      const transactionCount = randomInt(3, 8)

      for (let i = 0; i < transactionCount; i++) {
        const isCharge = Math.random() < 0.6

        const amount = randomFloat(300, 8000)

        if (isCharge) {
          currentDebt += amount
        } else {
          currentDebt = Math.max(0, currentDebt - amount)
        }

        await tx.insert(debtTransactions).values({
          debtEntryId: entry.id,
          type: isCharge ? 'charge' : 'deposit',
          amount,
          date: daysAgo(randomInt(0, 120)),
          note: isCharge ? randomItem(chargeNotes) : randomItem(depositNotes),
          createdAt: now
        })
      }

      await tx
        .update(debtEntries)
        .set({
          debt: Number(currentDebt.toFixed(2))
        })
        .where(sql`${debtEntries.id} = ${entry.id}`)
    }
  })

  console.log('✅ تم إنشاء بيانات الاختبار بنجاح!')
}

seed()
  .then(() => {
    console.log('🎉 انتهت عملية Seed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ فشل Seed:', error)
    process.exit(1)
  })
