import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { JobRequestQuotationRepository } from '../repositories/job-request-quotation.repo';
import { JobRequestRepository } from '../repositories/job-request.repo';
import { TradePersonKycRepository } from '../../identity/repositories/trade-person-kyc.repo';
import { JobRequestQuotationEventRepository } from '../repositories/job-request-quotation-event.repo';
import { QuotationRevisionRepository } from '../repositories/quotation-revision.repo';
import { PaymentRepository } from '../repositories/payment.repo';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PaystackWalletProvider } from '../../wallet/providers/paystack';
import { MessagingService } from '../../messaging/services/messaging.service';
import {
  CreateJobRequestQuotationDto,
  UpdateJobRequestQuotationDto,
  ReviseQuotationDto,
  JobRequestQuotationResponseDto,
  QuotationRevisionResponseDto,
} from '../dtos/job-request-quotation.dto';
import { TradePersonContractQueryDto, TradePersonContractResponseDto, ContractStatus } from '../dtos/trade-person-contract.dto';
import { PayUpfrontResponseDto, PaymentResponseDto, ReleaseResponseDto } from '../dtos/payment.dto';
import { VerificationCodeResponseDto } from '../dtos/verification-code.dto';
import { CreateReviewDto, ReviewResponseDto } from '../dtos/review.dto';
import { JobStatus } from '../models/job-request.model';
import { ReleaseRepository } from '../repositories/release.repo';
import { ReviewRepository } from '../repositories/review.repo';

@Injectable()
export class JobRequestQuotationService {
  private readonly logger = new Logger(JobRequestQuotationService.name);

  constructor(
    private readonly quotationRepo: JobRequestQuotationRepository,
    private readonly jobRequestRepo: JobRequestRepository,
    private readonly tradePersonKycRepo: TradePersonKycRepository,
    private readonly eventRepo: JobRequestQuotationEventRepository,
    private readonly revisionRepo: QuotationRevisionRepository,
    private readonly paymentRepo: PaymentRepository,
    private readonly releaseRepo: ReleaseRepository,
    private readonly reviewRepo: ReviewRepository,
    private readonly paystackProvider: PaystackWalletProvider,
    private readonly messagingService: MessagingService,
    private readonly configService: ConfigService,
  ) {}

  private mapTradePerson(tradePerson: any): { _id: string; userName?: string; email?: string; profileAvatar?: string } | null {
    if (!tradePerson) return null;
    if (typeof tradePerson === 'string' || tradePerson instanceof Types.ObjectId) {
      return { _id: tradePerson.toString() };
    }
    return {
      _id: tradePerson._id?.toString(),
      userName: tradePerson.userName,
      email: tradePerson.email,
      profileAvatar: tradePerson.profileAvatar,
    };
  }

  private calculateTotalAmount(dto: { materials?: any[]; tools?: any[]; workmanships?: any[] }): number {
    const lineTotal = (item: any) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || 0;
      const vat = item.vat || 0;
      return quantity * unitPrice + vat;
    };

    const materialsTotal = (dto.materials || []).reduce((sum, item) => sum + lineTotal(item), 0);
    const toolsTotal = (dto.tools || []).reduce((sum, item) => sum + lineTotal(item), 0);
    const workmanshipTotal = (dto.workmanships || []).reduce((sum, item) => sum + (item.price || 0), 0);

    return materialsTotal + toolsTotal + workmanshipTotal;
  }

  private mapToDto(doc: any): JobRequestQuotationResponseDto {
    return {
      _id: doc._id.toString(),
      quoteId: doc.quoteId,
      jobRequest: doc.jobRequest.toString(),
      tradePerson: this.mapTradePerson(doc.tradePerson),
      materials: doc.materials || [],
      tools: doc.tools || [],
      workmanships: doc.workmanships || [],
      reviewStatus: doc.reviewStatus || 'PENDING',
      rejectionReason: doc.rejectionReason || undefined,
      totalAmount: doc.totalAmount || 0,
      currentRevisionNumber: doc.currentRevisionNumber || 0,
      events: [],
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  private mapRevisionToDto(doc: any): QuotationRevisionResponseDto {
    return {
      _id: doc._id.toString(),
      quotation: doc.quotation.toString(),
      jobRequest: doc.jobRequest.toString(),
      tradePerson: doc.tradePerson.toString(),
      revisionNumber: doc.revisionNumber,
      materials: doc.materials || [],
      tools: doc.tools || [],
      workmanships: doc.workmanships || [],
      totalAmount: doc.totalAmount || 0,
      changeReason: doc.changeReason || undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  private mapPaymentToDto(doc: any): PaymentResponseDto {
    return {
      _id: doc._id.toString(),
      quotation: doc.quotation.toString(),
      jobRequest: doc.jobRequest.toString(),
      homeOwner: doc.homeOwner.toString(),
      tradePerson: doc.tradePerson.toString(),
      amount: doc.amount,
      currency: doc.currency || 'NGN',
      status: doc.status,
      paystackReference: doc.paystackReference,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  private mapReleaseToDto(doc: any): ReleaseResponseDto {
    return {
      _id: doc._id.toString(),
      payment: doc.payment.toString(),
      quotation: doc.quotation.toString(),
      jobRequest: doc.jobRequest.toString(),
      tradePerson: doc.tradePerson.toString(),
      releaseType: doc.releaseType,
      amount: doc.amount,
      currency: doc.currency || 'NGN',
      status: doc.status,
      paystackTransferReference: doc.paystackTransferReference || undefined,
      releasedBy: doc.releasedBy?.toString(),
      reason: doc.reason || undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  private mapReviewToDto(doc: any): ReviewResponseDto {
    return {
      _id: doc._id.toString(),
      jobRequest: doc.jobRequest.toString(),
      tradePerson: doc.tradePerson.toString(),
      homeOwner: doc.homeOwner.toString(),
      rating: doc.rating,
      comment: doc.comment || undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
  }

  private generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async generateQuoteId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let quoteId: string;
    let exists: any;
    do {
      quoteId = '';
      for (let i = 0; i < 6; i++) {
        quoteId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      exists = await this.quotationRepo.findOne({ quoteId });
    } while (exists);
    return quoteId;
  }

  private async assertJobAllowsNewQuotations(jobRequestId: string): Promise<void> {
    const jobRequest = await this.jobRequestRepo.findById(jobRequestId);
    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }
    if (jobRequest.status === JobStatus.QUOTATION_PAID) {
      throw new BadRequestException('This job already has an accepted and paid quotation. No more quotations can be submitted.');
    }
  }

  async create(tradePersonId: string, jobRequestId: string, dto: CreateJobRequestQuotationDto): Promise<JobRequestQuotationResponseDto> {
    const kycProfile = await this.tradePersonKycRepo.findOne({ user: new Types.ObjectId(tradePersonId) });
    if (!kycProfile || kycProfile.status !== 'APPROVED') {
      // Requirement currently relaxed in existing code; keep existing behavior.
    }

    const jobRequest = await this.jobRequestRepo.findOne({ _id: new Types.ObjectId(jobRequestId) });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    if (jobRequest.visibility === 'PRIVATE' && jobRequest.tradespersonId?.toString() !== tradePersonId) {
      throw new ForbiddenException('Only the assigned tradesperson can submit a quotation for this private job');
    }

    if (jobRequest.visibility === 'PUBLIC' && !tradePersonId) {
      throw new BadRequestException('Tradesperson id is required to submit a quotation');
    }

    await this.assertJobAllowsNewQuotations(jobRequestId);

    const existing = await this.quotationRepo.findOne({
      jobRequest: new Types.ObjectId(jobRequestId),
      tradePerson: new Types.ObjectId(tradePersonId),
    });

    if (existing) throw new BadRequestException('You have already submitted a quotation for this job request');

    const quoteId = await this.generateQuoteId();
    const totalAmount = this.calculateTotalAmount(dto);

    const doc = await this.quotationRepo.create({
      jobRequest: new Types.ObjectId(jobRequestId),
      tradePerson: new Types.ObjectId(tradePersonId),
      quoteId,
      materials: dto.materials,
      tools: dto.tools,
      workmanships: dto.workmanships,
      totalAmount,
      currentRevisionNumber: 0,
    });

    await this.eventRepo.create({
      quotation: doc._id,
      jobRequest: doc.jobRequest,
      tradePerson: new Types.ObjectId(tradePersonId),
      eventType: 'QUOTE_SUBMITTED',
      notes: 'Tradesperson submitted a quotation',
      metadata: { totalAmount },
    });

    return this.mapToDto(doc);
  }

  private mapEvent(event: any) {
    return {
      _id: event._id.toString(),
      quotation: event.quotation.toString(),
      jobRequest: event.jobRequest.toString(),
      eventType: event.eventType,
      notes: event.notes,
      tradePerson: event.tradePerson?.toString(),
      performedBy: event.performedBy?.toString(),
      metadata: event.metadata,
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : undefined,
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : undefined,
    };
  }

  private async mapToResponse(doc: any): Promise<JobRequestQuotationResponseDto> {
    const events = await this.eventRepo.findByQuotationIdAndTradePersonId(doc._id.toString(), doc.tradePerson.toString());
    return {
      ...this.mapToDto(doc),
      events: events.map((event) => this.mapEvent(event)),
    };
  }

  async getByJobRequestId(jobRequestId: string, tradePersonId: string): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findOne({ jobRequest: new Types.ObjectId(jobRequestId), tradePerson: new Types.ObjectId(tradePersonId) });
    if (!doc) {
      throw new NotFoundException('Quotation not found for this job request');
    }
    return this.mapToResponse(doc);
  }

  async update(tradePersonId: string, jobRequestId: string, dto: UpdateJobRequestQuotationDto): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findOne({ jobRequest: new Types.ObjectId(jobRequestId), tradePerson: new Types.ObjectId(tradePersonId) });
    if (!doc) {
      throw new NotFoundException('Quotation not found for this job request');
    }

    if (doc.tradePerson?.toString() !== tradePersonId) {
      throw new ForbiddenException('Only the tradesperson who submitted this quotation can update it');
    }

    if (doc.reviewStatus !== 'PENDING') {
      throw new BadRequestException('Only pending quotations can be updated');
    }

    const payload: any = {};
    if (dto.materials !== undefined) payload.materials = dto.materials;
    if (dto.tools !== undefined) payload.tools = dto.tools;
    if (dto.workmanships !== undefined) payload.workmanships = dto.workmanships;
    payload.totalAmount = this.calculateTotalAmount(payload);

    const updated = await this.quotationRepo.update(doc._id.toString(), payload);
    return this.mapToDto(updated);
  }

  async revise(
    tradePersonId: string,
    quotationId: string,
    dto: ReviseQuotationDto,
  ): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc) {
      throw new NotFoundException('Quotation not found');
    }

    if (doc.tradePerson?.toString() !== tradePersonId) {
      throw new ForbiddenException('Only the tradesperson who submitted this quotation can revise it');
    }

    if (doc.reviewStatus !== 'HOMEOWNER_REJECTED') {
      throw new BadRequestException('Only homeowner-rejected quotations can be revised');
    }

    const nextRevisionNumber = (doc.currentRevisionNumber || 0) + 1;
    const totalAmount = this.calculateTotalAmount(dto);

    await this.revisionRepo.create({
      quotation: doc._id,
      jobRequest: doc.jobRequest,
      tradePerson: doc.tradePerson,
      revisionNumber: doc.currentRevisionNumber || 0,
      materials: doc.materials,
      tools: doc.tools,
      workmanships: doc.workmanships,
      totalAmount: doc.totalAmount,
      changeReason: dto.changeReason,
    });

    const updated = await this.quotationRepo.update(doc._id.toString(), {
      materials: dto.materials,
      tools: dto.tools,
      workmanships: dto.workmanships,
      totalAmount,
      reviewStatus: 'PENDING',
      currentRevisionNumber: nextRevisionNumber,
      rejectionReason: null,
    });

    await this.eventRepo.create({
      quotation: updated._id,
      jobRequest: updated.jobRequest,
      tradePerson: updated.tradePerson,
      eventType: 'QUOTE_SUBMITTED',
      notes: `Tradesperson submitted revision ${nextRevisionNumber}`,
      metadata: { revisionNumber: nextRevisionNumber, changeReason: dto.changeReason, totalAmount },
    });

    return this.mapToResponse(updated);
  }

  async delete(tradePersonId: string, jobRequestId: string): Promise<void> {
    const doc = await this.quotationRepo.findByJobRequestId(jobRequestId);
    if (!doc) {
      throw new NotFoundException('Quotation not found for this job request');
    }

    if (doc.tradePerson?.toString() !== tradePersonId) {
      throw new ForbiddenException('Only the tradesperson who submitted this quotation can delete it');
    }

    if (doc.reviewStatus !== 'PENDING') {
      throw new BadRequestException('Only pending quotations can be deleted');
    }

    await this.quotationRepo.deleteById(doc._id.toString());
  }

  async reviewQuotation(
    quotationId: string,
    status: 'ADMIN_APPROVED' | 'ADMIN_REJECTED',
    reason?: string,
    adminId?: string,
  ): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc) {
      throw new NotFoundException('Quotation not found');
    }

    if (doc.reviewStatus !== 'PENDING') {
      throw new BadRequestException('Quotation has already been reviewed');
    }

    if (status === 'ADMIN_REJECTED' && !reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    if (status === 'ADMIN_APPROVED') {
      const existingApproved = await this.quotationRepo.findAdminApprovedByJobRequestId(doc.jobRequest.toString());
      if (existingApproved && existingApproved._id.toString() !== quotationId) {
        throw new BadRequestException('Another quotation for this job has already been approved by admin');
      }
    }

    const update: any = {
      reviewStatus: status,
      rejectionReason: status === 'ADMIN_REJECTED' ? reason : null,
    };

    const updated = await this.quotationRepo.updateIfPending(quotationId, update);
    if (!updated) {
      throw new BadRequestException('Quotation was already reviewed by another process');
    }

    const eventType = status === 'ADMIN_APPROVED' ? 'QUOTE_APPROVED' : 'QUOTE_REJECTED';
    await this.eventRepo.create({
      quotation: updated._id,
      jobRequest: updated.jobRequest,
      tradePerson: updated.tradePerson,
      eventType,
      notes: status === 'ADMIN_REJECTED' ? reason : `Quotation ${status.toLowerCase()}`,
      performedBy: adminId ? new Types.ObjectId(adminId) : undefined,
      metadata: { previousStatus: doc.reviewStatus, reason },
    });

    return this.mapToResponse(updated);
  }

  async acceptQuotation(
    homeOwnerId: string,
    jobRequestId: string,
    quotationId: string,
    notes?: string,
  ): Promise<JobRequestQuotationResponseDto> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc || doc.jobRequest.toString() !== jobRequestId) {
      throw new NotFoundException('Quotation not found for this job request');
    }

    if (doc.reviewStatus !== 'ADMIN_APPROVED') {
      throw new BadRequestException('Only admin-approved quotations can be accepted');
    }

    const existingAccepted = await this.quotationRepo.findAcceptedByJobRequestId(jobRequestId);
    if (existingAccepted && existingAccepted._id.toString() !== quotationId) {
      throw new BadRequestException('Another quotation has already been accepted for this job');
    }

    const updated = await this.quotationRepo.updateIfStatus(quotationId, ['ADMIN_APPROVED'], {
      reviewStatus: 'HOMEOWNER_ACCEPTED',
    });
    if (!updated) {
      throw new BadRequestException('Quotation is no longer available for acceptance');
    }

    await this.eventRepo.create({
      quotation: updated._id,
      jobRequest: updated.jobRequest,
      tradePerson: updated.tradePerson,
      eventType: 'QUOTE_APPROVED',
      notes: notes || 'Homeowner accepted the quotation',
      performedBy: new Types.ObjectId(homeOwnerId),
      metadata: { acceptedBy: homeOwnerId },
    });

    return this.mapToResponse(updated);
  }

  async rejectQuotation(
    homeOwnerId: string,
    jobRequestId: string,
    quotationId: string,
    reason?: string,
  ): Promise<JobRequestQuotationResponseDto> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc || doc.jobRequest.toString() !== jobRequestId) {
      throw new NotFoundException('Quotation not found for this job request');
    }

    if (doc.reviewStatus !== 'ADMIN_APPROVED') {
      throw new BadRequestException('Only admin-approved quotations can be rejected by homeowner');
    }

    const updated = await this.quotationRepo.updateIfStatus(quotationId, ['ADMIN_APPROVED'], {
      reviewStatus: 'HOMEOWNER_REJECTED',
      rejectionReason: reason || null,
    });
    if (!updated) {
      throw new BadRequestException('Quotation is no longer available for rejection');
    }

    await this.eventRepo.create({
      quotation: updated._id,
      jobRequest: updated.jobRequest,
      tradePerson: updated.tradePerson,
      eventType: 'QUOTE_REJECTED',
      notes: reason || 'Homeowner rejected the quotation',
      performedBy: new Types.ObjectId(homeOwnerId),
      metadata: { rejectedBy: homeOwnerId, reason },
    });

    return this.mapToResponse(updated);
  }

  async initializeUpfrontPayment(
    homeOwnerId: string,
    homeOwnerEmail: string,
    jobRequestId: string,
    quotationId: string,
  ): Promise<PayUpfrontResponseDto> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc || doc.jobRequest.toString() !== jobRequestId) {
      throw new NotFoundException('Quotation not found for this job request');
    }

    if (doc.reviewStatus !== 'HOMEOWNER_ACCEPTED') {
      throw new BadRequestException('Only accepted quotations can be paid for');
    }

    const existingPayment = await this.paymentRepo.findByQuotationId(quotationId);
    if (existingPayment?.status === 'SUCCESS' || existingPayment?.status === 'RELEASED') {
      throw new BadRequestException('Payment has already been completed for this quotation');
    }

    const reference = `TEG-${uuidv4()}`;
    const amountInKobo = Math.round((doc.totalAmount || 0) * 100);
    const callbackUrl = this.configService.get<string>('payment.callbackUrl');

    const initialized = await this.paystackProvider.initializeTransaction(
      homeOwnerEmail,
      amountInKobo,
      reference,
      callbackUrl,
      {
        quotationId: doc._id.toString(),
        jobRequestId: jobRequest._id.toString(),
        homeOwnerId,
        tradePersonId: doc.tradePerson.toString(),
      },
    );

    await this.paymentRepo.create({
      quotation: doc._id,
      jobRequest: jobRequest._id,
      homeOwner: new Types.ObjectId(homeOwnerId),
      tradePerson: doc.tradePerson,
      amount: doc.totalAmount || 0,
      currency: jobRequest.currency || 'NGN',
      status: 'PENDING',
      paystackReference: reference,
    });

    return {
      authorizationUrl: initialized.authorization_url,
      accessCode: initialized.access_code,
      reference: initialized.reference,
      amount: amountInKobo,
      currency: jobRequest.currency || 'NGN',
    };
  }

  async handlePaystackCallback(reference: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepo.findByReference(reference);
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === 'SUCCESS' || payment.status === 'RELEASED') {
      return this.mapPaymentToDto(payment);
    }

    const verification = await this.paystackProvider.verifyTransaction(reference);
    if (verification.status && verification.data?.status === 'success') {
      const updatedPayment = await this.paymentRepo.updateByReference(reference, {
        status: 'SUCCESS',
        amount: verification.data.amount / 100,
      });

      const quotation = await this.quotationRepo.update(payment.quotation.toString(), {
        reviewStatus: 'PAYMENT_COMPLETED',
      });

      const verificationCode = this.generateVerificationCode();
      await this.jobRequestRepo.update(payment.jobRequest.toString(), {
        status: JobStatus.QUOTATION_PAID,
        verificationCode,
        verificationCodeGeneratedAt: new Date(),
      });

      await this.messagingService.sendSystemJobMessage(
        quotation.tradePerson.toString(),
        'TRADESPERSON',
        payment.jobRequest.toString(),
        `Your verification code for this job is: ${verificationCode}. Present it to the homeowner when you arrive.`,
      );

      await this.eventRepo.create({
        quotation: quotation._id,
        jobRequest: quotation.jobRequest,
        tradePerson: quotation.tradePerson,
        eventType: 'RESIDENT_PAID',
        notes: 'Homeowner completed payment for the accepted quotation',
        performedBy: payment.homeOwner,
        metadata: { reference, amount: verification.data.amount / 100, verificationCode },
      });

      return this.mapPaymentToDto(updatedPayment);
    }

    await this.paymentRepo.updateByReference(reference, { status: 'FAILED' });
    throw new BadRequestException('Payment verification failed');
  }

  async handlePaystackWebhook(event: string, data: any): Promise<void> {
    if (event !== 'charge.success') {
      return;
    }
    const reference = data?.reference;
    if (!reference) return;

    try {
      await this.handlePaystackCallback(reference);
    } catch (error) {
      this.logger.error(`Failed to process Paystack webhook for ${reference}`, error.message);
    }
  }

  async releasePayment(
    adminId: string,
    quotationId: string,
    releaseType: 'INITIAL' | 'BALANCE',
    reason?: string,
  ): Promise<ReleaseResponseDto> {
    const quotation = await this.quotationRepo.findById(quotationId);
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    if (quotation.reviewStatus !== 'PAYMENT_COMPLETED') {
      throw new BadRequestException('Payment can only be released after homeowner has paid');
    }

    const payment = await this.paymentRepo.findByQuotationId(quotationId);
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status !== 'SUCCESS' && payment.status !== 'RELEASED') {
      throw new BadRequestException('Payment must be successful before release');
    }

    const existingRelease = await this.releaseRepo.findSuccessfulByPaymentIdAndType(
      payment._id.toString(),
      releaseType,
    );
    if (existingRelease) {
      throw new BadRequestException(`${releaseType.toLowerCase()} release has already been completed`);
    }

    const jobRequest = await this.jobRequestRepo.findById(payment.jobRequest.toString());
    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    if (releaseType === 'INITIAL') {
      if (!jobRequest.jobCompletedAt || !jobRequest.jobCompletedBy) {
        throw new BadRequestException('Initial release requires the homeowner to mark the job as completed');
      }
    }

    if (releaseType === 'BALANCE') {
      const initialRelease = await this.releaseRepo.findSuccessfulByPaymentIdAndType(
        payment._id.toString(),
        'INITIAL',
      );
      if (!initialRelease) {
        throw new BadRequestException('Initial release must be completed before balance release');
      }

      const now = new Date();
      const periodEnded = jobRequest.satisfactoryPeriodEndsAt && jobRequest.satisfactoryPeriodEndsAt <= now;
      const qaApproved = !!jobRequest.qaApprovedAt;
      if (!periodEnded && !qaApproved) {
        throw new BadRequestException(
          'Balance release requires either QA approval or the 14-day satisfactory period to have elapsed',
        );
      }
    }

    const kycProfile = await this.tradePersonKycRepo.findOne({
      user: quotation.tradePerson,
    });
    if (!kycProfile || kycProfile.status !== 'APPROVED') {
      throw new BadRequestException('Tradesperson KYC is not approved');
    }

    const bankAccount = (kycProfile.bankAccounts || [])[0];
    if (!bankAccount) {
      throw new BadRequestException('Tradesperson has no onboarded bank account');
    }

    let recipientCode = bankAccount.paystackRecipientCode;
    if (!recipientCode) {
      const recipient = await this.paystackProvider.createTransferRecipient(
        'nuban',
        bankAccount.accountName,
        bankAccount.accountNumber,
        bankAccount.bankCode,
        payment.currency || 'NGN',
      );
      recipientCode = recipient.recipient_code;

      await this.tradePersonKycRepo.update(
        { _id: kycProfile._id, 'bankAccounts.accountNumber': bankAccount.accountNumber },
        { $set: { 'bankAccounts.$.paystackRecipientCode': recipientCode } },
      );
    }

    const releasePercentage = this.configService.get<number>('payment.upfrontReleasePercentage') || 50;
    let releaseAmount: number;
    if (releaseType === 'INITIAL') {
      releaseAmount = Math.round((payment.amount * (releasePercentage / 100)) * 100) / 100;
    } else {
      const initialRelease = await this.releaseRepo.findSuccessfulByPaymentIdAndType(
        payment._id.toString(),
        'INITIAL',
      );
      const alreadyReleased = initialRelease?.amount || 0;
      releaseAmount = Math.round((payment.amount - alreadyReleased) * 100) / 100;
    }

    const releaseAmountInKobo = Math.round(releaseAmount * 100);
    const transferReference = `TEG-RELEASE-${uuidv4()}`;

    const transfer = await this.paystackProvider.initiateTransfer(
      'balance',
      releaseAmountInKobo,
      recipientCode,
      transferReference,
      reason || `${releaseType} release for quote ${quotation.quoteId}`,
    );

    const releasedBy = Types.ObjectId.isValid(adminId) ? new Types.ObjectId(adminId) : null;

    const release = await this.releaseRepo.create({
      payment: payment._id,
      quotation: quotation._id,
      jobRequest: payment.jobRequest,
      tradePerson: quotation.tradePerson,
      releaseType,
      amount: releaseAmount,
      currency: payment.currency || 'NGN',
      status: 'SUCCESS',
      paystackTransferReference: transfer.transfer_code,
      releasedBy,
      reason,
    });

    await this.paymentRepo.updateById(payment._id.toString(), { status: 'RELEASED' });

    await this.eventRepo.create({
      quotation: quotation._id,
      jobRequest: quotation.jobRequest,
      tradePerson: quotation.tradePerson,
      eventType: 'PAYMENT_RELEASED',
      notes: `Admin released ${releaseType.toLowerCase()} payment (${releaseAmount}) to tradesperson`,
      performedBy: releasedBy || undefined,
      metadata: { releaseType, releaseAmount, transferReference, reason },
    });

    return this.mapReleaseToDto(release);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoReleaseBalancePayments(): Promise<void> {
    this.logger.log('Running auto balance release cron');
    const jobs = await this.jobRequestRepo.findCompletedJobsReadyForBalanceRelease();

    for (const job of jobs) {
      try {
        const quotation = await this.quotationRepo.findPaidByJobRequestId(job._id.toString());
        if (!quotation) continue;

        const payment = await this.paymentRepo.findByQuotationId(quotation._id.toString());
        if (!payment || payment.status !== 'RELEASED') continue;

        const existingBalance = await this.releaseRepo.findSuccessfulByPaymentIdAndType(
          payment._id.toString(),
          'BALANCE',
        );
        if (existingBalance) continue;

        const initialRelease = await this.releaseRepo.findSuccessfulByPaymentIdAndType(
          payment._id.toString(),
          'INITIAL',
        );
        if (!initialRelease) continue;

        // Use a system/admin-less reference for the cron; in production this may be a dedicated system admin id.
        await this.releasePayment('system', quotation._id.toString(), 'BALANCE', 'Auto balance release after satisfactory period');
      } catch (error) {
        this.logger.error(`Auto balance release failed for job ${job._id}`, error.message);
      }
    }
  }

  async verifyCode(
    homeOwnerId: string,
    jobRequestId: string,
    code: string,
  ): Promise<{ valid: boolean; message: string }> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    if (!jobRequest.verificationCode) {
      throw new BadRequestException('No verification code has been generated for this job');
    }

    const valid = jobRequest.verificationCode === code;
    return {
      valid,
      message: valid ? 'Verification code is valid' : 'Verification code is invalid',
    };
  }

  async getVerificationCode(
    homeOwnerId: string,
    jobRequestId: string,
  ): Promise<VerificationCodeResponseDto> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    if (!jobRequest.verificationCode) {
      throw new BadRequestException('No verification code has been generated for this job');
    }

    return {
      code: jobRequest.verificationCode,
      generatedAt: jobRequest.verificationCodeGeneratedAt
        ? new Date(jobRequest.verificationCodeGeneratedAt).toISOString()
        : undefined,
    };
  }

  async markJobComplete(
    homeOwnerId: string,
    jobRequestId: string,
  ): Promise<{ jobRequestId: string; status: string; satisfactoryPeriodEndsAt: string }> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    if (jobRequest.status !== JobStatus.QUOTATION_PAID) {
      throw new BadRequestException('Job must be paid before it can be marked as complete');
    }

    const satisfactoryPeriodDays = 14;
    const satisfactoryPeriodEndsAt = new Date();
    satisfactoryPeriodEndsAt.setDate(satisfactoryPeriodEndsAt.getDate() + satisfactoryPeriodDays);

    const updated = await this.jobRequestRepo.update(jobRequestId, {
      status: JobStatus.COMPLETED,
      jobCompletedAt: new Date(),
      jobCompletedBy: new Types.ObjectId(homeOwnerId),
      satisfactoryPeriodEndsAt,
    });

    const quotation = await this.quotationRepo.findPaidByJobRequestId(jobRequestId);
    if (quotation) {
      await this.eventRepo.create({
        quotation: quotation._id,
        jobRequest: quotation.jobRequest,
        tradePerson: quotation.tradePerson,
        eventType: 'JOB_COMPLETED',
        notes: 'Homeowner marked the job as complete',
        performedBy: new Types.ObjectId(homeOwnerId),
        metadata: { satisfactoryPeriodEndsAt },
      });
    }

    return {
      jobRequestId: updated._id.toString(),
      status: updated.status,
      satisfactoryPeriodEndsAt: satisfactoryPeriodEndsAt.toISOString(),
    };
  }

  async requestJobCompletion(
    tradePersonId: string,
    jobRequestId: string,
  ): Promise<{ message: string }> {
    const jobRequest = await this.jobRequestRepo.findById(jobRequestId);
    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    const quotation = await this.quotationRepo.findPaidByJobRequestId(jobRequestId);
    if (!quotation || quotation.tradePerson.toString() !== tradePersonId) {
      throw new ForbiddenException('Only the assigned tradesperson can request job completion');
    }

    if (jobRequest.status !== JobStatus.QUOTATION_PAID) {
      throw new BadRequestException('Job must be paid before completion can be requested');
    }

    await this.jobRequestRepo.update(jobRequestId, {
      jobCompletionRequestedBy: new Types.ObjectId(tradePersonId),
    });

    await this.messagingService.sendSystemJobMessage(
      jobRequest.createdBy.toString(),
      'HOME_OWNER',
      jobRequestId,
      'The tradesperson has requested to mark this job as complete. Please confirm once the work is satisfactory.',
    );

    return { message: 'Completion request sent to homeowner' };
  }

  async approveQa(adminId: string, jobRequestId: string): Promise<{ message: string }> {
    const jobRequest = await this.jobRequestRepo.findById(jobRequestId);
    if (!jobRequest) {
      throw new NotFoundException('Job request not found');
    }

    if (jobRequest.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('QA can only be approved for completed jobs');
    }

    await this.jobRequestRepo.update(jobRequestId, {
      qaApprovedAt: new Date(),
      qaApprovedBy: new Types.ObjectId(adminId),
    });

    const quotation = await this.quotationRepo.findPaidByJobRequestId(jobRequestId);
    if (quotation) {
      await this.eventRepo.create({
        quotation: quotation._id,
        jobRequest: quotation.jobRequest,
        tradePerson: quotation.tradePerson,
        eventType: 'QA_APPROVED',
        notes: 'Admin approved QA for the job',
        performedBy: new Types.ObjectId(adminId),
      });
    }

    return { message: 'QA approved successfully' };
  }

  async createReview(
    homeOwnerId: string,
    jobRequestId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });
    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    if (jobRequest.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be submitted after job completion');
    }

    const existingReview = await this.reviewRepo.findByHomeOwnerAndJobRequest(homeOwnerId, jobRequestId);
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this job');
    }

    const quotation = await this.quotationRepo.findPaidByJobRequestId(jobRequestId);
    if (!quotation) {
      throw new NotFoundException('No paid quotation found for this job');
    }

    const review = await this.reviewRepo.create({
      jobRequest: new Types.ObjectId(jobRequestId),
      tradePerson: quotation.tradePerson,
      homeOwner: new Types.ObjectId(homeOwnerId),
      rating: dto.rating,
      comment: dto.comment,
    });

    return this.mapReviewToDto(review);
  }

  async getReviewsForTradePerson(tradePersonId: string): Promise<{
    reviews: ReviewResponseDto[];
    averageRating: number;
    total: number;
  }> {
    const reviews = await this.reviewRepo.findByTradePersonId(tradePersonId);
    const averageRating = await this.reviewRepo.getAverageRating(tradePersonId);
    return {
      reviews: reviews.map((r) => this.mapReviewToDto(r)),
      averageRating,
      total: reviews.length,
    };
  }

  async markAsResidentPaid(quotationId: string, homeOwnerId?: string): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc) {
      throw new NotFoundException('Quotation not found');
    }

    if (doc.reviewStatus !== 'HOMEOWNER_ACCEPTED') {
      throw new BadRequestException('Only accepted quotations can be marked as paid');
    }

    await this.eventRepo.create({
      quotation: doc._id,
      jobRequest: doc.jobRequest,
      tradePerson: doc.tradePerson,
      eventType: 'RESIDENT_PAID',
      notes: 'Resident completed payment for the approved quotation',
      performedBy: homeOwnerId ? new Types.ObjectId(homeOwnerId) : undefined,
      metadata: { homeOwnerId },
    });

    return this.mapToDto(doc);
  }

  async moveToAdminReview(quotationId: string, adminId?: string): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc) {
      throw new NotFoundException('Quotation not found');
    }

    await this.eventRepo.create({
      quotation: doc._id,
      jobRequest: doc.jobRequest,
      tradePerson: doc.tradePerson,
      eventType: 'ADMIN_REVIEW',
      notes: 'Quotation moved to admin review',
      performedBy: adminId ? new Types.ObjectId(adminId) : undefined,
    });

    return this.mapToDto(doc);
  }

  async getQuotationEvents(quotationId: string, tradePersonId: string) {
    const events = await this.eventRepo.findByQuotationIdAndTradePersonId(quotationId, tradePersonId);
    return events.map((event) => ({
      _id: event._id.toString(),
      quotation: event.quotation.toString(),
      jobRequest: event.jobRequest.toString(),
      eventType: event.eventType,
      notes: event.notes,
      tradePerson: event.tradePerson?.toString(),
      performedBy: event.performedBy?.toString(),
      metadata: event.metadata,
      createdAt: event.createdAt ? new Date(event.createdAt).toISOString() : undefined,
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : undefined,
    }));
  }

  async getQuotationRevisions(quotationId: string): Promise<QuotationRevisionResponseDto[]> {
    const revisions = await this.revisionRepo.findByQuotationId(quotationId);
    return revisions.map((revision) => this.mapRevisionToDto(revision));
  }

  async getAcceptedQuotationForHomeOwner(homeOwnerId: string, jobRequestId: string): Promise<JobRequestQuotationResponseDto> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    const doc = await this.quotationRepo.findAcceptedByJobRequestId(jobRequestId);
    if (!doc) {
      throw new NotFoundException('No accepted quotation found for this job request');
    }

    return this.mapToResponse(doc);
  }

  async listQuotationsForJob(jobRequestId: string): Promise<JobRequestQuotationResponseDto[]> {
    const docs = await this.quotationRepo.findByJobRequestIdAllPopulated(jobRequestId);
    return docs.map((doc) => this.mapToDto(doc));
  }

  async listQuotationsForHomeOwner(homeOwnerId: string, jobRequestId: string): Promise<JobRequestQuotationResponseDto[]> {
    const jobRequest = await this.jobRequestRepo.findOne({
      _id: new Types.ObjectId(jobRequestId),
      createdBy: new Types.ObjectId(homeOwnerId),
    });

    if (!jobRequest) {
      throw new NotFoundException('Job request not found or does not belong to you');
    }

    const docs = await this.quotationRepo.findVisibleToHomeOwnerByJobRequestId(jobRequestId);
    return docs.map((doc) => this.mapToDto(doc));
  }

  async getTradePersonContracts(tradePersonId: string, query: TradePersonContractQueryDto): Promise<TradePersonContractResponseDto[]> {
    const statusFilter = query.status;

    const assignedJobs = await this.jobRequestRepo.findByAssignedTradePerson(tradePersonId);
    const quotations = await this.quotationRepo.findByTradePersonId(tradePersonId);

    const jobIdsFromQuotes = quotations.map((q) => q.jobRequest.toString());
    const jobIdsFromAssignments = assignedJobs.map((j) => j._id.toString());
    const allJobIds = Array.from(new Set([...jobIdsFromQuotes, ...jobIdsFromAssignments]));

    const jobs = await this.jobRequestRepo.find({ _id: { $in: allJobIds.map((id) => new Types.ObjectId(id)) } });
    const jobMap = new Map(jobs.map((job) => [job._id.toString(), job]));

    const contracts: TradePersonContractResponseDto[] = [];

    for (const jobId of allJobIds) {
      const job = jobMap.get(jobId);
      if (!job) continue;

      const quotation = quotations.find((q) => q.jobRequest.toString() === jobId);
      const events = quotation ? await this.eventRepo.findByQuotationId(quotation._id.toString()) : [];
      const hasResidentPaidEvent = events.some((e) => e.eventType === 'RESIDENT_PAID');

      let status = ContractStatus.PENDING;
      if (hasResidentPaidEvent) {
        status = ContractStatus.ACTIVE;
      }

      if (statusFilter && status !== statusFilter) {
        continue;
      }

      contracts.push({
        jobRequest: job,
        status,
        quotation: quotation ? await this.mapToResponse(quotation) : undefined,
        createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : undefined,
      });
    }

    return contracts;
  }
}
