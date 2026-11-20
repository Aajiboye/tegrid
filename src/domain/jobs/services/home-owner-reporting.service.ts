import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { PaymentRepository } from '../repositories/payment.repo';
import { ReleaseRepository } from '../repositories/release.repo';
import { JobRequestRepository } from '../repositories/job-request.repo';
import { JobRequestQuotationRepository } from '../repositories/job-request-quotation.repo';
import {
  HomeOwnerReportingOverviewDto,
  HomeOwnerTransactionHistoryQueryDto,
  HomeOwnerTransactionItemDto,
  HomeOwnerTransactionDetailDto,
} from '../dtos/home-owner-reporting.dto';
import { TransactionDateFilter, TransactionTypeFilter } from '../dtos/trade-person-reporting.dto';

@Injectable()
export class HomeOwnerReportingService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly releaseRepo: ReleaseRepository,
    private readonly jobRequestRepo: JobRequestRepository,
    private readonly quotationRepo: JobRequestQuotationRepository,
  ) {}

  private resolveDateRange(filter?: TransactionDateFilter): Date | null {
    if (!filter || filter === TransactionDateFilter.ALL) return null;
    const days = filter === TransactionDateFilter.LAST_30_DAYS ? 30 : filter === TransactionDateFilter.LAST_60_DAYS ? 60 : 90;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private async getTransactions(homeOwnerId: string, query: HomeOwnerTransactionHistoryQueryDto): Promise<HomeOwnerTransactionItemDto[]> {
    const fromDate = this.resolveDateRange(query.dateFilter);
    const type = query.type || TransactionTypeFilter.ALL;

    const paymentQuery: any = { homeOwner: new Types.ObjectId(homeOwnerId) };
    if (fromDate) paymentQuery.createdAt = { $gte: fromDate };

    const payments = type === TransactionTypeFilter.RELEASE ? [] : await (this.paymentRepo as any).model.find(paymentQuery).lean();

    const paymentIds = payments.map((p: any) => p._id.toString());
    const releaseQuery: any = { payment: { $in: paymentIds.map((id) => new Types.ObjectId(id)) } };
    if (fromDate) releaseQuery.createdAt = { $gte: fromDate };

    const releases = type === TransactionTypeFilter.PAYMENT ? [] : await (this.releaseRepo as any).model.find(releaseQuery).lean();

    const paymentItems: HomeOwnerTransactionItemDto[] = payments.map((doc: any) => ({
      _id: doc._id.toString(),
      type: 'PAYMENT',
      amount: doc.amount,
      currency: doc.currency || 'NGN',
      status: doc.status,
      reference: doc.paystackReference,
      jobRequestId: doc.jobRequest.toString(),
      quotationId: doc.quotation.toString(),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    }));

    const releaseItems: HomeOwnerTransactionItemDto[] = releases.map((doc: any) => ({
      _id: doc._id.toString(),
      type: 'RELEASE',
      amount: doc.amount,
      currency: doc.currency || 'NGN',
      status: doc.status,
      reference: doc.paystackTransferReference,
      releaseType: doc.releaseType,
      jobRequestId: doc.jobRequest.toString(),
      quotationId: doc.quotation.toString(),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    }));

    return [...paymentItems, ...releaseItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getOverview(homeOwnerId: string): Promise<HomeOwnerReportingOverviewDto> {
    const payments = await (this.paymentRepo as any).model.find({ homeOwner: new Types.ObjectId(homeOwnerId) }).lean();

    const totalSpent = payments
      .filter((p: any) => ['SUCCESS', 'RELEASED'].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const pendingPayments = payments
      .filter((p: any) => p.status === 'PENDING')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const completedPayments = payments
      .filter((p: any) => ['SUCCESS', 'RELEASED'].includes(p.status))
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const failedPayments = payments
      .filter((p: any) => p.status === 'FAILED')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return {
      totalSpent,
      pendingPayments,
      completedPayments,
      failedPayments,
      currency: 'NGN',
    };
  }

  async getTransactionHistory(homeOwnerId: string, query: HomeOwnerTransactionHistoryQueryDto) {
    const page = Number(query.page || 1);
    const size = Number(query.size || 20);
    const all = await this.getTransactions(homeOwnerId, query);
    const start = (page - 1) * size;
    const data = all.slice(start, start + size);
    const pageTotal = Math.ceil(all.length / size) || 1;

    return {
      page,
      size,
      pageTotal,
      hasNext: page < pageTotal,
      hasPrevious: page > 1,
      data,
    };
  }

  async getTransactionDetail(homeOwnerId: string, transactionId: string): Promise<HomeOwnerTransactionDetailDto> {
    const payment = await (this.paymentRepo as any).model.findOne({ _id: new Types.ObjectId(transactionId), homeOwner: new Types.ObjectId(homeOwnerId) }).lean();
    const release = payment ? null : await (this.releaseRepo as any).model.findOne({ _id: new Types.ObjectId(transactionId) }).lean();

    if (!payment && !release) {
      throw new NotFoundException('Transaction not found');
    }

    const source: any = payment || release;
    const job = await this.jobRequestRepo.findById(source.jobRequest.toString());
    const quotation = await this.quotationRepo.findById(source.quotation.toString());

    const materialsSubtotal = (quotation?.materials || []).reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unitPrice || 0)), 0);
    const toolsSubtotal = (quotation?.tools || []).reduce((sum: number, item: any) => sum + ((item.quantity || 1) * (item.unitPrice || 0)), 0);
    const workmanshipSubtotal = (quotation?.workmanships || []).reduce((sum: number, item: any) => sum + (item.price || 0), 0);
    const subtotal = materialsSubtotal + toolsSubtotal + workmanshipSubtotal;
    const vat = (quotation?.materials || []).reduce((sum: number, item: any) => sum + (item.vat || 0), 0)
      + (quotation?.tools || []).reduce((sum: number, item: any) => sum + (item.vat || 0), 0);
    const total = quotation?.totalAmount || source.amount || 0;
    const deliveryFee = Math.max(total - subtotal - vat, 0);

    return {
      _id: source._id.toString(),
      type: payment ? 'PAYMENT' : 'RELEASE',
      amount: source.amount,
      currency: source.currency || 'NGN',
      status: source.status,
      reference: source.paystackReference || source.paystackTransferReference,
      releaseType: source.releaseType,
      jobRequestId: source.jobRequest.toString(),
      quotationId: source.quotation.toString(),
      createdAt: source.createdAt ? new Date(source.createdAt).toISOString() : undefined,
      jobTitle: job?.title,
      jobDescription: job?.description,
      homeAddress: job?.homeAddress,
      quotationTotalAmount: quotation?.totalAmount,
      quotationStatus: quotation?.reviewStatus,
      paymentStatus: payment?.status,
      releaseStatus: release?.status,
      subtotal,
      deliveryFee,
      vat,
      total,
    };
  }

  private async generatePdfBuffer(title: string, rows: string[][]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(title, { align: 'left' });
      doc.moveDown();

      rows.forEach((row) => {
        doc.fontSize(10).text(row.join(' | '));
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  async exportTransactions(homeOwnerId: string, query: HomeOwnerTransactionHistoryQueryDto, format: 'csv' | 'pdf'): Promise<{ contentType: string; filename: string; content: string | Buffer }> {
    const transactions = await this.getTransactions(homeOwnerId, query);
    const rows = [
      ['Transaction ID', 'Type', 'Amount', 'Currency', 'Status', 'Reference', 'Release Type', 'Job Request ID', 'Quotation ID', 'Created At'],
      ...transactions.map((t) => [
        t._id,
        t.type,
        String(t.amount),
        t.currency,
        t.status,
        t.reference || '',
        t.releaseType || '',
        t.jobRequestId,
        t.quotationId,
        t.createdAt,
      ]),
    ];

    if (format === 'csv') {
      const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      return {
        contentType: 'text/csv',
        filename: `homeowner-transactions-${Date.now()}.csv`,
        content: csv,
      };
    }

    const pdf = await this.generatePdfBuffer('HomeOwner Transaction History', rows);
    return {
      contentType: 'application/pdf',
      filename: `homeowner-transactions-${Date.now()}.pdf`,
      content: pdf,
    };
  }

  async exportTransactionDetail(homeOwnerId: string, transactionId: string, format: 'csv' | 'pdf'): Promise<{ contentType: string; filename: string; content: string | Buffer }> {
    const detail = await this.getTransactionDetail(homeOwnerId, transactionId);
    const rows = [
      ['Field', 'Value'],
      ['Transaction ID', detail._id],
      ['Type', detail.type],
      ['Amount', String(detail.amount)],
      ['Currency', detail.currency],
      ['Status', detail.status],
      ['Reference', detail.reference || ''],
      ['Release Type', detail.releaseType || ''],
      ['Job Request ID', detail.jobRequestId],
      ['Quotation ID', detail.quotationId],
      ['Job Title', detail.jobTitle || ''],
      ['Job Description', detail.jobDescription || ''],
      ['Home Address', detail.homeAddress || ''],
      ['Quotation Total', String(detail.quotationTotalAmount ?? '')],
      ['Quotation Status', detail.quotationStatus || ''],
      ['Created At', detail.createdAt],
    ];

    if (format === 'csv') {
      const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      return {
        contentType: 'text/csv',
        filename: `homeowner-transaction-${transactionId}.csv`,
        content: csv,
      };
    }

    const pdf = await this.generatePdfBuffer(`HomeOwner Transaction ${transactionId}`, rows);
    return {
      contentType: 'application/pdf',
      filename: `homeowner-transaction-${transactionId}.pdf`,
      content: pdf,
    };
  }
}
