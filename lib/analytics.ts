import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Dashboard aggregations.
 *
 * Revenue counts every order that hasn't been cancelled. Orders arrive via
 * WhatsApp checkout and are confirmed manually, so "revenue" here means the
 * value of live orders, not settled payments — the paid/unpaid split is tracked
 * separately on each order.
 */

export type DashboardStats = {
  revenue: number;
  paidRevenue: number;
  orderCount: number;
  pendingOrders: number;
  customerCount: number;
  productCount: number;
  totalVisits: number;
  uniqueVisitors: number;
  visitsToday: number;
  ordersToday: number;
  revenueThisMonth: number;
};

const LIVE_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = startOfToday();
  const monthStart = startOfMonth();

  const [
    revenueAgg,
    paidAgg,
    orderCount,
    pendingOrders,
    customerCount,
    productCount,
    totalVisits,
    uniqueVisitorRows,
    visitsToday,
    ordersToday,
    monthAgg,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: [...LIVE_ORDER_STATUSES] } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID' },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.customer.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.pageView.count(),
    // COUNT(DISTINCT) in SQL rather than Prisma's `distinct` — the latter would
    // pull every page-view row into memory just to count the unique hashes.
    prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(DISTINCT "visitorHash") AS count FROM "PageView"`,
    ),
    prisma.pageView.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart }, status: { in: [...LIVE_ORDER_STATUSES] } },
    }),
  ]);

  return {
    revenue: revenueAgg._sum.total ?? 0,
    paidRevenue: paidAgg._sum.total ?? 0,
    orderCount,
    pendingOrders,
    customerCount,
    productCount,
    totalVisits,
    uniqueVisitors: Number(uniqueVisitorRows[0]?.count ?? 0),
    visitsToday,
    ordersToday,
    revenueThisMonth: monthAgg._sum.total ?? 0,
  };
}

export type DailyPoint = { date: string; visits: number; visitors: number; orders: number };

/**
 * Daily visits/visitors/orders for the last N days.
 *
 * Uses a generate_series left join so days with zero activity still appear —
 * grouping in JS over sparse rows would silently drop them and make the chart lie.
 */
export async function getDailySeries(days = 14): Promise<DailyPoint[]> {
  const rows = await prisma.$queryRaw<
    { date: Date; visits: bigint; visitors: bigint; orders: bigint }[]
  >(Prisma.sql`
    WITH span AS (
      SELECT generate_series(
        (CURRENT_DATE - ${days - 1}::int),
        CURRENT_DATE,
        '1 day'::interval
      )::date AS day
    )
    SELECT
      span.day AS date,
      COALESCE(v.visits, 0)   AS visits,
      COALESCE(v.visitors, 0) AS visitors,
      COALESCE(o.orders, 0)   AS orders
    FROM span
    LEFT JOIN (
      SELECT "createdAt"::date AS day,
             COUNT(*)                        AS visits,
             COUNT(DISTINCT "visitorHash")   AS visitors
      FROM "PageView"
      GROUP BY 1
    ) v ON v.day = span.day
    LEFT JOIN (
      SELECT "createdAt"::date AS day, COUNT(*) AS orders
      FROM "Order"
      GROUP BY 1
    ) o ON o.day = span.day
    ORDER BY span.day ASC
  `);

  return rows.map((row) => ({
    // Postgres DATE comes back as a Date at UTC midnight; slice avoids a
    // timezone shift that would label points with the wrong day.
    date: row.date.toISOString().slice(0, 10),
    visits: Number(row.visits),
    visitors: Number(row.visitors),
    orders: Number(row.orders),
  }));
}

export async function getOrdersByStatus() {
  const grouped = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true },
    orderBy: { status: 'asc' },
  });
  return grouped.map((row) => ({ status: row.status, count: row._count._all }));
}

export async function getTopProducts(limit = 5) {
  const grouped = await prisma.orderItem.groupBy({
    by: ['slug', 'name'],
    _sum: { qty: true, lineTotal: true },
    orderBy: { _sum: { qty: 'desc' } },
    take: limit,
  });

  return grouped.map((row) => ({
    slug: row.slug,
    name: row.name,
    qty: row._sum.qty ?? 0,
    revenue: row._sum.lineTotal ?? 0,
  }));
}

export async function getRecentOrders(limit = 8) {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      total: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
    },
  });
}

export async function getTopPages(limit = 6) {
  const grouped = await prisma.pageView.groupBy({
    by: ['path'],
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take: limit,
  });
  return grouped.map((row) => ({ path: row.path, views: row._count._all }));
}
