const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/errorHandler.middleware');
const { ValidationError, NotFoundError } = require('../utils/errors');

const prisma = new PrismaClient();

// GET /api/v1/payments
const getAllPayments = asyncHandler(async (req, res) => {
  const { month, dormitoryId, studentId, status, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {};
  if (month) where.month = month;
  if (dormitoryId) where.dormitoryId = dormitoryId;
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;

  const [total, payments] = await Promise.all([
    prisma.paymentRecord.count({ where }),
    prisma.paymentRecord.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        dormitory: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
  ]);

  res.json({ success: true, data: payments, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
});

// GET /api/v1/payments/stats
const getPaymentStats = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const where = month ? { month } : {};

  const [total, paid, pending, late] = await Promise.all([
    prisma.paymentRecord.aggregate({ where, _sum: { amount: true }, _count: { id: true } }),
    prisma.paymentRecord.aggregate({ where: { ...where, status: "TO'LANDI" }, _sum: { amount: true }, _count: { id: true } }),
    prisma.paymentRecord.count({ where: { ...where, status: 'KUTILMOQDA' } }),
    prisma.paymentRecord.count({ where: { ...where, status: 'KECHIKDI' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalAmount: total._sum.amount || 0,
      totalCount: total._count.id,
      paidAmount: paid._sum.amount || 0,
      paidCount: paid._count.id,
      pendingCount: pending,
      lateCount: late,
      collectionRate: total._count.id > 0 ? Math.round((paid._count.id / total._count.id) * 100) : 0,
    },
  });
});

// POST /api/v1/payments
const createPayment = asyncHandler(async (req, res) => {
  const { studentId, dormitoryId, month, amount, status, receiptNum, note } = req.body;

  if (!studentId || !dormitoryId || !month || !amount) {
    throw new ValidationError('studentId, dormitoryId, month va amount majburiy');
  }

  const existing = await prisma.paymentRecord.findFirst({ where: { studentId, month } });
  if (existing) {
    throw new ValidationError(`${month} oyi uchun to'lov allaqachon mavjud`);
  }

  const payment = await prisma.paymentRecord.create({
    data: {
      studentId,
      dormitoryId,
      month,
      amount: parseFloat(amount),
      status: status || 'KUTILMOQDA',
      receiptNum: receiptNum?.trim(),
      note: note?.trim(),
      paidAt: status === "TO'LANDI" ? new Date() : null,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      dormitory: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ success: true, data: payment });
});

// PATCH /api/v1/payments/:id
const updatePayment = asyncHandler(async (req, res) => {
  const { status, receiptNum, note, paidAt } = req.body;

  const payment = await prisma.paymentRecord.update({
    where: { id: req.params.id },
    data: {
      status,
      receiptNum: receiptNum?.trim(),
      note: note?.trim(),
      paidAt: paidAt ? new Date(paidAt) : (status === "TO'LANDI" ? new Date() : null),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      dormitory: { select: { id: true, name: true } },
    },
  });

  res.json({ success: true, data: payment });
});

// DELETE /api/v1/payments/:id
const deletePayment = asyncHandler(async (req, res) => {
  const exists = await prisma.paymentRecord.findUnique({ where: { id: req.params.id } });
  if (!exists) throw new NotFoundError("To'lov topilmadi");
  await prisma.paymentRecord.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: "To'lov o'chirildi" });
});

module.exports = { getAllPayments, getPaymentStats, createPayment, updatePayment, deletePayment };
