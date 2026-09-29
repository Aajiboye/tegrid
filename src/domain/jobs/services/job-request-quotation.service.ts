import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { JobRequestQuotationRepository } from '../repositories/job-request-quotation.repo';
import { JobRequestRepository } from '../repositories/job-request.repo';
import { TradePersonKycRepository } from '../../identity/repositories/trade-person-kyc.repo';
import { JobRequestQuotationEventRepository } from '../repositories/job-request-quotation-event.repo';
import { CreateJobRequestQuotationDto, UpdateJobRequestQuotationDto, JobRequestQuotationResponseDto } from '../dtos/job-request-quotation.dto';
import { TradePersonContractQueryDto, TradePersonContractResponseDto, ContractStatus } from '../dtos/trade-person-contract.dto';

@Injectable()
export class JobRequestQuotationService {
  constructor(
    private readonly quotationRepo: JobRequestQuotationRepository,
    private readonly jobRequestRepo: JobRequestRepository,
    private readonly tradePersonKycRepo: TradePersonKycRepository,
    private readonly eventRepo: JobRequestQuotationEventRepository,
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
      rejectionReason: doc.reviewStatus === 'REJECTED' ? doc.rejectionReason : undefined,
      events: [],
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
    };
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

  async create(tradePersonId: string, jobRequestId: string, dto: CreateJobRequestQuotationDto): Promise<JobRequestQuotationResponseDto> {
    const kycProfile = await this.tradePersonKycRepo.findOne({ user: new Types.ObjectId(tradePersonId) });
    if (!kycProfile || kycProfile.status !== 'APPROVED') {
    //   throw new ForbiddenException('Only tradespersons with approved KYC can submit a quotation');
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

    const existing = await this.quotationRepo.findOne({
      jobRequest: new Types.ObjectId(jobRequestId),
      tradePerson: new Types.ObjectId(tradePersonId),
    });

    if (existing) throw new BadRequestException('You have already submitted a quotation for this job request');

    const quoteId = await this.generateQuoteId();

    const doc = await this.quotationRepo.create({
      jobRequest: new Types.ObjectId(jobRequestId),
      tradePerson: new Types.ObjectId(tradePersonId),
      quoteId,
      materials: dto.materials,
      tools: dto.tools,
      workmanships: dto.workmanships,
    });

    await this.eventRepo.create({
      quotation: doc._id,
      jobRequest: doc.jobRequest,
      tradePerson: new Types.ObjectId(tradePersonId),
      eventType: 'QUOTE_SUBMITTED',
      notes: 'Tradesperson submitted a quotation',
      metadata: doc,
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

    const payload: any = {};
    if (dto.materials !== undefined) payload.materials = dto.materials;
    if (dto.tools !== undefined) payload.tools = dto.tools;
    if (dto.workmanships !== undefined) payload.workmanships = dto.workmanships;

    const updated = await this.quotationRepo.update(doc._id.toString(), payload);
    return this.mapToDto(updated);
  }

  async delete(tradePersonId: string, jobRequestId: string): Promise<void> {
    const doc = await this.quotationRepo.findByJobRequestId(jobRequestId);
    if (!doc) {
      throw new NotFoundException('Quotation not found for this job request');
    }

    if (doc.tradePerson?.toString() !== tradePersonId) {
      throw new ForbiddenException('Only the tradesperson who submitted this quotation can delete it');
    }

    await this.quotationRepo.deleteById(doc._id.toString());
  }

  async reviewQuotation(quotationId: string, status: 'ACCEPTED' | 'REJECTED', reason?: string, adminId?: string): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc) {
      throw new NotFoundException('Quotation not found');
    }

    if (doc.reviewStatus !== 'PENDING') {
      throw new BadRequestException('Quotation has already been reviewed');
    }

    if (status === 'REJECTED' && !reason) {
      throw new BadRequestException('Rejection reason is required');
    }

    if (status === 'ACCEPTED') {
      const existingApproved = await this.quotationRepo.findAcceptedByJobRequestIdExcludeCurrent(
        doc.jobRequest.toString(),
        quotationId,
      );
      if (existingApproved) {
        throw new BadRequestException('Another quotation for this job has already been approved');
      }
    }

    const update: any = {
      reviewStatus: status,
      rejectionReason: status === 'REJECTED' ? reason : null,
    };

    const updated = await this.quotationRepo.updateIfPending(quotationId, update);
    if (!updated) {
      throw new BadRequestException('Quotation was already reviewed by another process');
    }

    const eventType = status === 'ACCEPTED' ? 'QUOTE_APPROVED' : 'QUOTE_REJECTED';
    await this.eventRepo.create({
      quotation: updated._id,
      jobRequest: updated.jobRequest,
      tradePerson: updated.tradePerson,
      eventType,
      notes: status === 'REJECTED' ? reason : `Quotation ${status.toLowerCase()}`,
      performedBy: adminId ? new Types.ObjectId(adminId) : undefined,
      metadata: { previousStatus: doc.reviewStatus, reason },
    });

    return this.mapToResponse(updated);
  }

  async markAsResidentPaid(quotationId: string, homeOwnerId?: string): Promise<JobRequestQuotationResponseDto> {
    const doc = await this.quotationRepo.findById(quotationId);
    if (!doc) {
      throw new NotFoundException('Quotation not found');
    }

    if (doc.reviewStatus !== 'ACCEPTED') {
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

    const docs = await this.quotationRepo.findByJobRequestIdAllPopulated(jobRequestId);
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
